using System.Net;

namespace Castor.Tests;

[Collection(PostgresCollection.Name)]
public sealed class SignOutApiTests(PostgresFixture postgres)
{
    [Fact]
    public async Task After_signing_out_a_protected_endpoint_answers_unauthorized()
    {
        HttpClient client = await TestApi.SignedInAsync(postgres, "ada-sign-out@example.com");

        HttpResponseMessage signedOut = await client.PostAsync("/auth/sign-out", null);
        HttpResponseMessage again = await client.PostAsync("/auth/sign-out", null);

        Assert.Equal(HttpStatusCode.NoContent, signedOut.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, again.StatusCode);
    }
}
