using System.Net;
using System.Net.Http.Json;
using Castor.Api.Features.Innovations;

namespace Castor.Tests;

/// <summary>Atlas: the library of innovations, open to visitors without an account.</summary>
[Collection(PostgresCollection.Name)]
public sealed class InnovationLibraryApiTests(PostgresFixture postgres)
{
    [Fact]
    public async Task Searching_without_polish_letters_finds_a_title_written_with_them()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        await KnowledgeData.AddInnovationsWithoutGenomeAsync(factory, "Świetlica sąsiedzka", "Klub sportowy");
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        List<InnovationSummaryResponse>? found = await client.GetFromJsonAsync<List<InnovationSummaryResponse>>("/api/innovations?search=swietlica");

        Assert.Equal("Świetlica sąsiedzka", Assert.Single(found!).Title);
    }

    [Fact]
    public async Task Filtering_by_a_challenge_area_keeps_the_innovations_whose_genome_names_it()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        ChallengeArea seniors = await KnowledgeData.AddChallengeAreaAsync(factory, "SENIORS", 8);
        await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Klub Seniora", seniors);
        await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Świetlica bez obszaru");
        await KnowledgeData.AddInnovationsWithoutGenomeAsync(factory, "Bez genomu");
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        List<InnovationSummaryResponse>? all = await client.GetFromJsonAsync<List<InnovationSummaryResponse>>("/api/innovations");
        List<InnovationSummaryResponse>? filtered = await client.GetFromJsonAsync<List<InnovationSummaryResponse>>("/api/innovations?challengeArea=SENIORS");

        Assert.Equal(3, all!.Count);
        InnovationSummaryResponse match = Assert.Single(filtered!);
        Assert.Equal("Klub Seniora", match.Title);
        Assert.Equal(["SENIORS"], match.ChallengeAreaCodes);
    }

    [Fact]
    public async Task An_unknown_stage_is_refused_rather_than_ignored()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage response = await client.GetAsync("/api/innovations?stage=GOTOWE");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task A_visitor_opens_an_innovation_card_and_an_unknown_one_is_not_found()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        ChallengeArea seniors = await KnowledgeData.AddChallengeAreaAsync(factory, "SENIORS", 8);
        Guid innovationId = await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Klub Seniora", seniors);
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        InnovationResponse? card = await client.GetFromJsonAsync<InnovationResponse>($"/api/innovations/{innovationId}");
        HttpResponseMessage unknown = await client.GetAsync($"/api/innovations/{Guid.NewGuid()}");

        Assert.Equal("Klub Seniora", card!.Title);
        Assert.Equal(["SENIORS"], card.ChallengeAreaCodes);
        Assert.False(card.CanToggleSeeksTesters);
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
    }
}
