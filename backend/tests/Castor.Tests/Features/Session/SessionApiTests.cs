using System.Net.Http.Json;
using Castor.Api.Features.Session;

namespace Castor.Tests;

[Collection(PostgresCollection.Name)]
public sealed class SessionApiTests(PostgresFixture postgres)
{
    [Fact]
    public async Task A_visitor_without_an_account_is_not_signed_in()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        SessionResponse? session = await client.GetFromJsonAsync<SessionResponse>("/api/auth/session");

        Assert.False(session!.SignedIn);
        Assert.Null(session.UserId);
    }

    [Fact]
    public async Task A_newly_registered_user_is_a_signed_in_resident()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        HttpClient client = await TestApi.SignInAsync(factory, "ada-session@example.com");

        SessionResponse? session = await client.GetFromJsonAsync<SessionResponse>("/api/auth/session");

        Assert.True(session!.SignedIn);
        Assert.Equal("ada-session@example.com", session.Email);
        Assert.Equal("RESIDENT", session.Role);
    }

    [Fact]
    public async Task The_bootstrap_administrator_signs_in_as_an_administrator()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        HttpClient admin = await TestApi.AdminAsync(factory);

        SessionResponse? session = await admin.GetFromJsonAsync<SessionResponse>("/api/auth/session");

        Assert.Equal("ADMIN", session!.Role);
    }
}
