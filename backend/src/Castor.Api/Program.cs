using System.Reflection;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Castor.Api.Features.FitAssessments;
using Castor.Api.Features.Innovations;
using Castor.Api.Features.Municipalities;
using Castor.Api.Features.ProblemReports;
using Castor.Api.Features.Register;
using Castor.Api.Features.Session;
using Castor.Api.Features.SignIn;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers(options =>
    {
        options.Conventions.Add(new ApiRoutePrefixConvention());
        options.Filters.Add(new AuthorizeFilter());
        options.Filters.Add<DomainExceptionFilter>();
    })
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddOpenApi();
builder.Services.AddSignalR();

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "Castor.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.SlidingExpiration = true;
        options.ExpireTimeSpan = TimeSpan.FromDays(14);
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();

// In a container the keys that sign the cookie would be lost on every restart and sign everybody out.
string? dataProtectionKeysPath = builder.Configuration["DataProtection:KeysPath"];
if (!string.IsNullOrWhiteSpace(dataProtectionKeysPath))
{
    var keysDirectory = new DirectoryInfo(dataProtectionKeysPath);
    builder.Services.AddDataProtection().PersistKeysToFileSystem(keysDirectory);
}

// The API is reached only through nginx (container) or the Vite proxy (local), never straight from the internet, so
// the client address they forward is trusted — the rate limit per IP needs it.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

int publicAiPermitLimit = builder.Configuration.GetValue("RateLimiting:PublicAi:PermitLimit", 10);
int publicAiWindowSeconds = builder.Configuration.GetValue("RateLimiting:PublicAi:WindowSeconds", 60);
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        var refusal = new { error = "Too many requests. Wait a minute and try again." };
        await context.HttpContext.Response.WriteAsJsonAsync(refusal, cancellationToken);
    };
    options.AddPolicy(RateLimitPolicies.PublicAi, httpContext =>
    {
        string clientAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(clientAddress, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = publicAiPermitLimit,
            Window = TimeSpan.FromSeconds(publicAiWindowSeconds),
            QueueLimit = 0,
        });
    });
});

// Infrastructure
builder.Services.AddSingleton<IClock, SystemClock>();
builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CurrentUser>();

// Language model: the adapter comes from Llm:Provider; an unknown provider stops the start-up (SPEC 3).
string llmProvider = builder.Configuration["Llm:Provider"] ?? string.Empty;
switch (llmProvider)
{
    case LlmProviders.Placeholder:
        builder.Services.AddSingleton<ILlmClient, PlaceholderLlmClient>();
        break;
    default:
        throw new InvalidOperationException(
            $"Llm:Provider '{llmProvider}' is not supported. Known providers: {LlmProviders.Placeholder}.");
}

// AI pipelines
builder.Services.Configure<MatchingOptions>(builder.Configuration.GetSection(MatchingOptions.Section));
builder.Services.AddScoped<InnovationCandidatesQuery>();
builder.Services.AddScoped<ProblemClassifier>();
builder.Services.AddScoped<Matchmaker>();
builder.Services.AddScoped<GenomeGenerator>();
builder.Services.AddScoped<FitAssessor>();
builder.Services.AddScoped<FitAssistant>();

// Start-up: schema, interrupted jobs, seed — registered before the job runner, so the runner starts on a ready database.
// The build-time OpenAPI generator (GetDocument.Insider) and dotnet-ef (ef) run this file too; they get no database.
string? entryAssembly = Assembly.GetEntryAssembly()?.GetName().Name;
bool runByBuildTool = entryAssembly is "GetDocument.Insider" or "ef";
if (!runByBuildTool)
{
    builder.Services.AddHostedService<DatabaseStartup>();
}

// Background jobs
builder.Services.AddSingleton<BackgroundJobQueue>();
builder.Services.AddScoped<BackgroundJobScheduler>();
builder.Services.AddScoped<GenerateGenomesJob>();
builder.Services.AddHostedService<BackgroundJobRunner>();

// Seed
builder.Services.AddScoped<SeedImporter>();

// Account and session
builder.Services.AddScoped<RegisterHandler>();
builder.Services.AddScoped<SignInHandler>();
builder.Services.AddScoped<GetSessionHandler>();

// Municipalities
builder.Services.AddScoped<ListMunicipalitiesHandler>();

// Problem reports
builder.Services.AddScoped<ProblemReportViewQuery>();
builder.Services.AddScoped<CreateProblemReportHandler>();
builder.Services.AddScoped<AnswerProblemReportQuestionsHandler>();
builder.Services.AddScoped<GetProblemReportHandler>();
builder.Services.AddScoped<TrackProblemReportHandler>();
builder.Services.AddScoped<ClaimProblemReportHandler>();
builder.Services.AddScoped<ListMyProblemReportsHandler>();

// Innovations
builder.Services.AddScoped<GetInnovationHandler>();

// Fit assessments
builder.Services.AddScoped<MunicipalityPortraitQuery>();
builder.Services.AddScoped<CreateFitAssessmentHandler>();
builder.Services.AddScoped<FindFitAssessmentHandler>();
builder.Services.AddScoped<GetFitAssessmentHandler>();
builder.Services.AddScoped<AskFitAssistantHandler>();
builder.Services.AddScoped<ListFitAssistantMessagesHandler>();

// Each resource adds its queries and handlers here, one line each.

string? connectionString = builder.Configuration.GetConnectionString("Castor");
builder.Services.AddDbContext<CastorDbContext>(options =>
    options.UseNpgsql(connectionString, npgsql => npgsql.UseVector()));

WebApplication app = builder.Build();

app.UseForwardedHeaders();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// Development only: the document describes every endpoint, including the shape of the sign-in request.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi().AllowAnonymous();
    app.MapScalarApiReference().AllowAnonymous();
}

app.MapControllers();
app.MapHub<LiveHub>(LiveHub.Path);
await app.RunAsync();

public partial class Program;
