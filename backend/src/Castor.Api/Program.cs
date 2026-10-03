using System.Reflection;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Castor.Api.Features.BackgroundJobs;
using Castor.Api.Features.ChallengeAreas;
using Castor.Api.Features.Conversations;
using Castor.Api.Features.FitAssessments;
using Castor.Api.Features.GrantApplications;
using Castor.Api.Features.GrantCalls;
using Castor.Api.Features.Ideas;
using Castor.Api.Features.Indicators;
using Castor.Api.Features.InnovationGenomes;
using Castor.Api.Features.Innovations;
using Castor.Api.Features.Municipalities;
using Castor.Api.Features.ProblemReports;
using Castor.Api.Features.Radar;
using Castor.Api.Features.Register;
using Castor.Api.Features.Session;
using Castor.Api.Features.SignIn;
using Castor.Api.Features.Users;
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
builder.Services.AddScoped<ReplyDrafter>();
builder.Services.AddScoped<GrantCallDrafter>();
builder.Services.AddScoped<SimilarIdeasQuery>();
builder.Services.AddScoped<DuplicateChecker>();
builder.Services.AddScoped<IdeaAssistant>();
builder.Services.AddScoped<GrantApplicationWriter>();
builder.Services.AddScoped<PlainTextWriter>();

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

// Seed and the bootstrap administrator
builder.Services.AddScoped<SeedImporter>();
builder.Services.AddScoped<AdminBootstrap>();

// Account and session
builder.Services.AddScoped<RegisterHandler>();
builder.Services.AddScoped<SignInHandler>();
builder.Services.AddScoped<GetSessionHandler>();

// Challenge areas
builder.Services.AddScoped<ListChallengeAreasHandler>();
builder.Services.AddScoped<GetChallengeAreaHandler>();
builder.Services.AddScoped<GetChallengeAreaPlainTextHandler>();
builder.Services.AddScoped<GenerateChallengeAreaPlainTextHandler>();
builder.Services.AddScoped<ReviseChallengeAreaPlainTextHandler>();
builder.Services.AddScoped<ApproveChallengeAreaPlainTextHandler>();

// Municipalities
builder.Services.AddScoped<ListMunicipalitiesHandler>();
builder.Services.AddScoped<GetMunicipalityProfileHandler>();

// Problem reports
builder.Services.AddScoped<ProblemReportViewQuery>();
builder.Services.AddScoped<CreateProblemReportHandler>();
builder.Services.AddScoped<AnswerProblemReportQuestionsHandler>();
builder.Services.AddScoped<GetProblemReportHandler>();
builder.Services.AddScoped<TrackProblemReportHandler>();
builder.Services.AddScoped<ClaimProblemReportHandler>();
builder.Services.AddScoped<ListMyProblemReportsHandler>();
builder.Services.AddScoped<SuggestedExpertsQuery>();
builder.Services.AddScoped<ListInboxProblemReportsHandler>();
builder.Services.AddScoped<GetInboxProblemReportHandler>();
builder.Services.AddScoped<DraftProblemReportReplyHandler>();
builder.Services.AddScoped<SaveProblemReportReplyDraftHandler>();
builder.Services.AddScoped<SendProblemReportReplyHandler>();
builder.Services.AddScoped<MoveProblemReportHandler>();
builder.Services.AddScoped<MarkProblemReportAnsweredHandler>();

// Conversations
builder.Services.AddScoped<ExpertChallengeAreasQuery>();
builder.Services.AddScoped<ListConversationsHandler>();
builder.Services.AddScoped<GetConversationHandler>();
builder.Services.AddScoped<PostMessageHandler>();
builder.Services.AddScoped<CreateExpertQuestionHandler>();
builder.Services.AddScoped<CreatePartnershipHandler>();

// Innovations
builder.Services.AddScoped<GetInnovationHandler>();
builder.Services.AddScoped<ListInnovationsHandler>();
builder.Services.AddScoped<CreateInnovationHandler>();
builder.Services.AddScoped<ReviseInnovationHandler>();
builder.Services.AddScoped<GetInnovationPlainTextHandler>();
builder.Services.AddScoped<GenerateInnovationPlainTextHandler>();
builder.Services.AddScoped<ReviseInnovationPlainTextHandler>();
builder.Services.AddScoped<ApproveInnovationPlainTextHandler>();

// Obserwator indicators (the Atlas map)
builder.Services.AddScoped<ListIndicatorsHandler>();
builder.Services.AddScoped<GetIndicatorValuesHandler>();

// Innovation genomes
builder.Services.AddScoped<ListInnovationGenomesHandler>();
builder.Services.AddScoped<GetInnovationGenomeHandler>();
builder.Services.AddScoped<ReviseInnovationGenomeHandler>();
builder.Services.AddScoped<ApproveInnovationGenomeHandler>();
builder.Services.AddScoped<RecalculateInnovationGenomeHandler>();

// Background jobs in the panel
builder.Services.AddScoped<ListBackgroundJobsHandler>();
builder.Services.AddScoped<QueueGenomeGenerationHandler>();

// Users and roles
builder.Services.AddScoped<ListUsersHandler>();
builder.Services.AddScoped<AssignUserRoleHandler>();

// Radar
builder.Services.AddScoped<GetRadarHandler>();

// Grant calls
builder.Services.AddScoped<ListGrantCallsHandler>();
builder.Services.AddScoped<ListAllGrantCallsHandler>();
builder.Services.AddScoped<CreateGrantCallHandler>();
builder.Services.AddScoped<ReviseGrantCallHandler>();
builder.Services.AddScoped<OpenGrantCallHandler>();
builder.Services.AddScoped<CloseGrantCallHandler>();
builder.Services.AddScoped<DraftGrantCallHandler>();

// Fit assessments
builder.Services.AddScoped<MunicipalityPortraitQuery>();
builder.Services.AddScoped<CreateFitAssessmentHandler>();
builder.Services.AddScoped<FindFitAssessmentHandler>();
builder.Services.AddScoped<RecalculateFitAssessmentHandler>();
builder.Services.AddScoped<GetFitAssessmentHandler>();
builder.Services.AddScoped<AskFitAssistantHandler>();
builder.Services.AddScoped<ListFitAssistantMessagesHandler>();

// Ideas (the Kreator)
builder.Services.AddScoped<IdeaViewQuery>();
builder.Services.AddScoped<IdeaReaderFactory>();
builder.Services.AddScoped<IdeaCardResolver>();
builder.Services.AddScoped<GetIdeaCanvasHandler>();
builder.Services.AddScoped<ListMyIdeasHandler>();
builder.Services.AddScoped<ListSubmittedIdeasHandler>();
builder.Services.AddScoped<ListIdeasForReviewHandler>();
builder.Services.AddScoped<CreateIdeaHandler>();
builder.Services.AddScoped<CreateIdeaFromHybridHandler>();
builder.Services.AddScoped<GetIdeaHandler>();
builder.Services.AddScoped<ReviseIdeaHandler>();
builder.Services.AddScoped<SubmitIdeaHandler>();
builder.Services.AddScoped<CheckIdeaSimilarityHandler>();
builder.Services.AddScoped<JoinIdeaHandler>();
builder.Services.AddScoped<ListIdeaAssistantMessagesHandler>();
builder.Services.AddScoped<AskIdeaAssistantHandler>();
builder.Services.AddScoped<ReviewIdeaHandler>();
builder.Services.AddScoped<ListAdminIdeasHandler>();
builder.Services.AddScoped<DecideIdeaHandler>();
builder.Services.AddScoped<ConvertIdeaToInnovationHandler>();

// Grant applications
builder.Services.AddScoped<CreateGrantApplicationHandler>();
builder.Services.AddScoped<GetGrantApplicationHandler>();
builder.Services.AddScoped<ReviseGrantApplicationHandler>();
builder.Services.AddScoped<ListGrantCallApplicationsHandler>();

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
