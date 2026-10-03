using System.Net.Http.Json;
using Castor.Api.Features.Register;
using Castor.Api.Features.SignIn;
using Castor.Api.Shared;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Castor.Tests;

/// <summary>A migrated database of its own behind a signed-in client.</summary>
internal static class TestApi
{
    public const string AdminEmail = "admin@castor.test";

    public const string AdminPassword = "admin-password1";

    public static readonly WebApplicationFactoryClientOptions Cookies = new()
    {
        AllowAutoRedirect = false,
        HandleCookies = true,
    };

    public static async Task<ApiFactory> FactoryAsync(PostgresFixture postgres)
    {
        string connectionString = await postgres.CreateMigratedDatabaseAsync();

        return new ApiFactory(connectionString);
    }

    /// <summary>The API with <paramref name="llm"/> as its language model.</summary>
    public static async Task<ApiFactory> FactoryAsync(
        PostgresFixture postgres,
        ScriptedLlmClient llm,
        IReadOnlyDictionary<string, string?>? settings = null)
    {
        string connectionString = await postgres.CreateMigratedDatabaseAsync();

        return new ApiFactory(
            connectionString,
            settings,
            services =>
            {
                services.RemoveAll<ILlmClient>();
                services.AddSingleton<ILlmClient>(llm);
            });
    }

    public static async Task<HttpClient> SignedInAsync(PostgresFixture postgres, string email)
    {
        ApiFactory factory = await FactoryAsync(postgres);

        return await SignInAsync(factory, email);
    }

    public static async Task<HttpClient> SignInAsync(ApiFactory factory, string email)
    {
        HttpClient client = factory.CreateClient(Cookies);
        HttpResponseMessage registered = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, "password1"));
        registered.EnsureSuccessStatusCode();

        return client;
    }

    /// <summary>The bootstrap administrator every test API starts with.</summary>
    public static async Task<HttpClient> AdminAsync(ApiFactory factory)
    {
        HttpClient client = factory.CreateClient(Cookies);
        HttpResponseMessage signedIn = await client.PostAsJsonAsync("/api/auth/sign-in", new SignInRequest(AdminEmail, AdminPassword));
        signedIn.EnsureSuccessStatusCode();

        return client;
    }

    /// <summary>Test data written straight to the API's database, through the domain's own factories.</summary>
    public static async Task WithDatabaseAsync(ApiFactory factory, Func<CastorDbContext, Task> work)
    {
        await using AsyncServiceScope scope = factory.Services.CreateAsyncScope();
        CastorDbContext db = scope.ServiceProvider.GetRequiredService<CastorDbContext>();
        await work(db);
    }
}
