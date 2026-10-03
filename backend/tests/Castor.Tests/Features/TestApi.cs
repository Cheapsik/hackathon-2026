using System.Net.Http.Json;
using Castor.Api.Features.Register;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Castor.Tests;

/// <summary>A migrated database of its own behind a signed-in client.</summary>
internal static class TestApi
{
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

    public static async Task<HttpClient> SignedInAsync(PostgresFixture postgres, string email)
    {
        ApiFactory factory = await FactoryAsync(postgres);

        return await SignInAsync(factory, email);
    }

    public static async Task<HttpClient> SignInAsync(ApiFactory factory, string email)
    {
        HttpClient client = factory.CreateClient(Cookies);
        HttpResponseMessage registered = await client.PostAsJsonAsync("/auth/register", new RegisterRequest(email, "password1"));
        registered.EnsureSuccessStatusCode();

        return client;
    }
}
