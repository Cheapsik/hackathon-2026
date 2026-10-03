using System.Net;
using System.Net.Http.Json;
using Castor.Api.Features.FitAssessments;

namespace Castor.Tests;

/// <summary>"Karta dopasowania do gminy": generated once per innovation, gmina and data year, then open to everyone.</summary>
[Collection(PostgresCollection.Name)]
public sealed class FitAssessmentApiTests(PostgresFixture postgres)
{
    [Fact]
    public async Task A_signed_in_user_generates_a_card_that_is_reused_and_open_to_visitors()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        (Guid innovationId, string teryt) = await InnovationAndGminaWithDataAsync(factory);
        HttpClient user = await TestApi.SignInAsync(factory, "ada-fit@example.com");
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage generated = await user.PostAsJsonAsync($"/api/innovations/{innovationId}/fit", new CreateFitAssessmentRequest(teryt));
        FitAssessmentResponse? card = await generated.Content.ReadFromJsonAsync<FitAssessmentResponse>();
        HttpResponseMessage again = await user.PostAsJsonAsync($"/api/innovations/{innovationId}/fit", new CreateFitAssessmentRequest(teryt));
        FitAssessmentResponse? reused = await again.Content.ReadFromJsonAsync<FitAssessmentResponse>();
        FitAssessmentResponse? seen = await visitor.GetFromJsonAsync<FitAssessmentResponse>($"/api/innovations/{innovationId}/fit?teryt={teryt}");

        Assert.Equal(HttpStatusCode.Created, generated.StatusCode);
        Assert.Equal(2023, card!.DataYear);
        Assert.Contains(card.Fit, new[] { "HIGH", "MEDIUM", "LOW" });
        Assert.Equal(teryt, card.Municipality.Teryt);
        Assert.Equal(HttpStatusCode.OK, again.StatusCode);
        Assert.Equal(card.Id, reused!.Id);
        Assert.Equal(card.Id, seen!.Id);
    }

    [Fact]
    public async Task A_visitor_without_an_account_cannot_generate_a_card()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        (Guid innovationId, string teryt) = await InnovationAndGminaWithDataAsync(factory);
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage generated = await visitor.PostAsJsonAsync($"/api/innovations/{innovationId}/fit", new CreateFitAssessmentRequest(teryt));
        HttpResponseMessage notYet = await visitor.GetAsync($"/api/innovations/{innovationId}/fit?teryt={teryt}");

        Assert.Equal(HttpStatusCode.Unauthorized, generated.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, notYet.StatusCode);
    }

    [Fact]
    public async Task An_innovation_without_a_genome_or_a_gmina_without_data_is_a_conflict()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        (Guid innovationId, _) = await InnovationAndGminaWithDataAsync(factory);
        Guid withoutGenome = await KnowledgeData.AddInnovationAsync(factory, "Bez genomu", InnovationStage.READY);
        // Another powiat, so the powiat figures of 1206 do not reach it either.
        await TestApi.WithDatabaseAsync(factory, async db =>
        {
            db.Municipalities.Add(Municipality.Register("1207011", "Gmina bez danych", MunicipalityType.RURAL, "limanowski", DateTimeOffset.UtcNow));
            await db.SaveChangesAsync();
        });
        HttpClient user = await TestApi.SignInAsync(factory, "jan-fit@example.com");

        HttpResponseMessage noGenome = await user.PostAsJsonAsync($"/api/innovations/{withoutGenome}/fit", new CreateFitAssessmentRequest("1206001"));
        HttpResponseMessage noData = await user.PostAsJsonAsync($"/api/innovations/{innovationId}/fit", new CreateFitAssessmentRequest("1207011"));

        Assert.Equal(HttpStatusCode.Conflict, noGenome.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, noData.StatusCode);
    }

    /// <summary>An innovation for seniors and a gmina with one general and one senior indicator for 2023.</summary>
    private static async Task<(Guid InnovationId, string Teryt)> InnovationAndGminaWithDataAsync(ApiFactory factory)
    {
        ChallengeArea seniors = await KnowledgeData.AddChallengeAreaAsync(factory, "SENIORS", 8);
        Guid innovationId = await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Klub Seniora", seniors);
        IReadOnlyList<string> teryts = await KnowledgeData.AddMunicipalitiesAsync(factory, "Bobowa", "Biecz");
        await KnowledgeData.AddIndicatorAsync(
            factory,
            1,
            "Udział osób 65+",
            [],
            new IndicatorFigure(StatisticsLevel.GMINA, teryts[0], 2023, 20m),
            new IndicatorFigure(StatisticsLevel.GMINA, teryts[1], 2023, 30m));
        await KnowledgeData.AddIndicatorAsync(
            factory,
            2,
            "Miejsca w DPS",
            ["SENIORS"],
            new IndicatorFigure(StatisticsLevel.POWIAT, "1206", 2023, 12m));

        return (innovationId, teryts[0]);
    }
}
