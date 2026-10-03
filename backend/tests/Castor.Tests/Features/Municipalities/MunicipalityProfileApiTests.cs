using System.Net;
using System.Net.Http.Json;
using Castor.Api.Features.Municipalities;

namespace Castor.Tests;

/// <summary>A gmina's Obserwator figures next to the region average — the data behind the fit card.</summary>
[Collection(PostgresCollection.Name)]
public sealed class MunicipalityProfileApiTests(PostgresFixture postgres)
{
    [Fact]
    public async Task A_general_indicator_shows_the_gminas_newest_value_next_to_the_region_average()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        IReadOnlyList<string> teryts = await KnowledgeData.AddMunicipalitiesAsync(factory, "Bobowa", "Biecz");
        await KnowledgeData.AddIndicatorAsync(
            factory,
            1,
            "Udział osób 65+",
            [],
            new IndicatorFigure(StatisticsLevel.GMINA, teryts[0], 2022, 18m),
            new IndicatorFigure(StatisticsLevel.GMINA, teryts[0], 2023, 20m),
            new IndicatorFigure(StatisticsLevel.GMINA, teryts[1], 2023, 30m));
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        MunicipalityProfileResponse? profile = await client.GetFromJsonAsync<MunicipalityProfileResponse>($"/api/municipalities/{teryts[0]}/profile");

        Assert.Equal("Bobowa", profile!.Name);
        ProfileIndicatorResponse indicator = Assert.Single(profile.Indicators);
        Assert.Equal("GMINA", indicator.Level);
        Assert.Equal(2023, indicator.Year);
        Assert.Equal(20m, indicator.Value);
        Assert.Equal(25m, indicator.RegionAverage);
        Assert.True(indicator.General);
    }

    [Fact]
    public async Task An_area_indicator_published_only_per_powiat_shows_the_powiats_value()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        IReadOnlyList<string> teryts = await KnowledgeData.AddMunicipalitiesAsync(factory, "Bobowa");
        await KnowledgeData.AddChallengeAreaAsync(factory, "SENIORS", 8);
        await KnowledgeData.AddIndicatorAsync(
            factory,
            2,
            "Miejsca w DPS",
            ["SENIORS"],
            new IndicatorFigure(StatisticsLevel.POWIAT, "1206", 2023, 12m));
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        MunicipalityProfileResponse? general = await client.GetFromJsonAsync<MunicipalityProfileResponse>($"/api/municipalities/{teryts[0]}/profile");
        MunicipalityProfileResponse? seniors = await client.GetFromJsonAsync<MunicipalityProfileResponse>(
            $"/api/municipalities/{teryts[0]}/profile?challengeArea=SENIORS");

        Assert.Empty(general!.Indicators);
        ProfileIndicatorResponse indicator = Assert.Single(seniors!.Indicators);
        Assert.Equal("POWIAT", indicator.Level);
        Assert.Equal(12m, indicator.Value);
    }

    [Fact]
    public async Task An_unknown_gmina_or_challenge_area_is_not_found()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        IReadOnlyList<string> teryts = await KnowledgeData.AddMunicipalitiesAsync(factory, "Bobowa");
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage unknownGmina = await client.GetAsync("/api/municipalities/9999999/profile");
        HttpResponseMessage unknownArea = await client.GetAsync($"/api/municipalities/{teryts[0]}/profile?challengeArea=NOPE");

        Assert.Equal(HttpStatusCode.NotFound, unknownGmina.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unknownArea.StatusCode);
    }
}
