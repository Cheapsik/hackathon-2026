using System.Net;
using System.Net.Http.Json;
using Castor.Api.Features.Register;
using Castor.Api.Features.SignIn;

namespace Castor.Tests;

[Collection(PostgresCollection.Name)]
public sealed class SignInApiTests(PostgresFixture postgres)
{
    [Fact]
    public async Task A_registered_user_signs_in_with_the_right_password()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        HttpClient registering = factory.CreateClient(TestApi.Cookies);
        HttpResponseMessage registered = await registering.PostAsJsonAsync(
            "/api/auth/register",
            new RegisterRequest("ada-sign-in@example.com", "password1"));
        RegisterResponse? account = await registered.Content.ReadFromJsonAsync<RegisterResponse>();
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage signedIn = await client.PostAsJsonAsync(
            "/api/auth/sign-in",
            new SignInRequest("ADA-sign-in@example.com", "password1"));
        SignInResponse? session = await signedIn.Content.ReadFromJsonAsync<SignInResponse>();
        HttpResponseMessage signedOut = await client.PostAsync("/api/auth/sign-out", null);

        Assert.Equal(HttpStatusCode.OK, signedIn.StatusCode);
        Assert.Equal(account!.UserId, session!.UserId);
        Assert.Equal(HttpStatusCode.NoContent, signedOut.StatusCode);
    }

    /// <summary>A wrong password and an unknown address get the same answer, so the response does not reveal accounts.</summary>
    [Fact]
    public async Task A_wrong_password_and_an_unknown_e_mail_are_refused_alike()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        await TestApi.SignInAsync(factory, "jan-sign-in@example.com");
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage wrongPassword = await client.PostAsJsonAsync(
            "/api/auth/sign-in",
            new SignInRequest("jan-sign-in@example.com", "password2"));
        HttpResponseMessage unknownEmail = await client.PostAsJsonAsync(
            "/api/auth/sign-in",
            new SignInRequest("nobody-sign-in@example.com", "password1"));
        string wrongPasswordBody = await wrongPassword.Content.ReadAsStringAsync();
        string unknownEmailBody = await unknownEmail.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.Unauthorized, wrongPassword.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknownEmail.StatusCode);
        Assert.Equal(wrongPasswordBody, unknownEmailBody);
    }
}
