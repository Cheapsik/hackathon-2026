using System.Text.Json.Serialization;
using Castor.Api.Features.Register;
using Castor.Api.Features.SignIn;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
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

// Infrastructure
builder.Services.AddSingleton<IClock, SystemClock>();
builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CurrentUser>();

// Account and session
builder.Services.AddScoped<RegisterHandler>();
builder.Services.AddScoped<SignInHandler>();

// Each resource adds its queries and handlers here, one line each.

string? connectionString = builder.Configuration.GetConnectionString("Castor");
builder.Services.AddDbContext<CastorDbContext>(options =>
    options.UseNpgsql(connectionString, npgsql => npgsql.UseVector()));

WebApplication app = builder.Build();

// The demo container brings its own schema up; locally the team runs dotnet-ef database update.
if (app.Configuration.GetValue<bool>("Database:MigrateOnStartup"))
{
    await using AsyncServiceScope scope = app.Services.CreateAsyncScope();
    CastorDbContext db = scope.ServiceProvider.GetRequiredService<CastorDbContext>();
    await db.Database.MigrateAsync();
}

app.UseAuthentication();
app.UseAuthorization();

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
