using System.Net;
using System.Net.Http.Json;
using Castor.Api.Features.Register;

namespace Castor.Tests;

[Collection(PostgresCollection.Name)]
public sealed class RegisterApiTests(PostgresFixture postgres)
{
    [Fact]
    public async Task A_new_account_is_created_and_signed_in_at_once()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage registered = await client.PostAsJsonAsync(
            "/auth/register",
            new RegisterRequest("ada-register@example.com", "password1"));
        RegisterResponse? account = await registered.Content.ReadFromJsonAsync<RegisterResponse>();
        HttpResponseMessage signedOut = await client.PostAsync("/auth/sign-out", null);

        Assert.Equal(HttpStatusCode.Created, registered.StatusCode);
        Assert.NotEqual(Guid.Empty, account!.UserId);
        Assert.Equal(HttpStatusCode.NoContent, signedOut.StatusCode);
    }

    [Fact]
    public async Task An_e_mail_already_registered_in_any_letter_case_is_refused_with_a_conflict()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage first = await client.PostAsJsonAsync(
            "/auth/register",
            new RegisterRequest("jan-register@example.com", "password1"));
        HttpResponseMessage second = await client.PostAsJsonAsync(
            "/auth/register",
            new RegisterRequest("  JAN-Register@Example.com ", "password2"));

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task A_password_shorter_than_the_policy_allows_is_refused()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage registered = await client.PostAsJsonAsync(
            "/auth/register",
            new RegisterRequest("short-password@example.com", "short"));

        Assert.Equal(HttpStatusCode.BadRequest, registered.StatusCode);
    }
}
