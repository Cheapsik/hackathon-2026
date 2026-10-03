using System.Net.Http.Json;
using Castor.Api.Features.Municipalities;

namespace Castor.Tests;

[Collection(PostgresCollection.Name)]
public sealed class MunicipalitySearchApiTests(PostgresFixture postgres)
{
    [Fact]
    public async Task Typed_percent_and_underscore_match_themselves_not_every_gmina()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        await KnowledgeData.AddMunicipalitiesAsync(factory, "Bobowa", "Biecz");
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        List<MunicipalityResponse>? percent = await client.GetFromJsonAsync<List<MunicipalityResponse>>("/api/municipalities?search=%25");
        List<MunicipalityResponse>? underscore = await client.GetFromJsonAsync<List<MunicipalityResponse>>("/api/municipalities?search=_");
        List<MunicipalityResponse>? prefix = await client.GetFromJsonAsync<List<MunicipalityResponse>>("/api/municipalities?search=bob");

        Assert.Empty(percent!);
        Assert.Empty(underscore!);
        Assert.Equal("Bobowa", Assert.Single(prefix!).Name);
    }
}
