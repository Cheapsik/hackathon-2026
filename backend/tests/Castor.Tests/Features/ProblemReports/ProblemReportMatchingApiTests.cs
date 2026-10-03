using System.Net;
using System.Net.Http.Json;
using Castor.Api.Features.ProblemReports;
using Castor.Api.Shared;

namespace Castor.Tests;

/// <summary>
/// "Opisz problem" when the language model fails: the report is never lost, keeps its tracking code and answers, and
/// is classified and matched once the model answers again.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class ProblemReportMatchingApiTests(PostgresFixture postgres)
{
    /// <summary>Well over twelve content words: the placeholder model asks no clarifying questions.</summary>
    private const string SpecificDescription =
        "Samotni seniorzy mieszkający w naszej wsi od wielu miesięcy nie mają świetlicy ani regularnych spotkań sąsiedzkich. "
        + "Brakuje transportu do miasta, wolontariuszy, opiekunek oraz zajęć ruchowych przez cały tydzień, a rodziny pracują daleko.";

    /// <summary>Too general for the placeholder model, which asks three clarifying questions.</summary>
    private const string GeneralDescription = "Seniorzy w gminie są samotni i bez wsparcia.";

    [Fact]
    public async Task A_report_the_model_cannot_classify_is_stored_with_its_tracking_code()
    {
        var llm = new ScriptedLlmClient();
        llm.Fail<ProblemClassificationResult>();
        ApiFactory factory = await TestApi.FactoryAsync(postgres, llm);
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage created = await client.PostAsJsonAsync("/api/problem-reports", Report(SpecificDescription));
        ProblemReportResponse? report = await created.Content.ReadFromJsonAsync<ProblemReportResponse>();

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.False(string.IsNullOrWhiteSpace(report!.TrackingCode));
        Assert.False(report.AwaitsAnswers);
        Assert.False(report.IsMatched);
    }

    [Fact]
    public async Task Opening_the_report_by_its_tracking_code_matches_it_once_the_model_answers_again()
    {
        var llm = new ScriptedLlmClient();
        llm.Fail<ProblemClassificationResult>();
        ApiFactory factory = await TestApi.FactoryAsync(postgres, llm);
        await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Klub Seniora");
        HttpClient client = factory.CreateClient(TestApi.Cookies);
        HttpResponseMessage created = await client.PostAsJsonAsync("/api/problem-reports", Report(SpecificDescription));
        ProblemReportResponse? stored = await created.Content.ReadFromJsonAsync<ProblemReportResponse>();

        ProblemReportResponse? stillDown = await client.GetFromJsonAsync<ProblemReportResponse>($"/api/problem-reports/track/{stored!.TrackingCode}");
        llm.Recover();
        ProblemReportResponse? tracked = await client.GetFromJsonAsync<ProblemReportResponse>($"/api/problem-reports/track/{stored.TrackingCode}");

        Assert.False(stillDown!.IsMatched);
        Assert.True(tracked!.IsMatched);
        Assert.Equal(stored.Id, tracked.Id);
    }

    [Fact]
    public async Task Answers_survive_a_failed_matching_and_the_report_is_matched_when_opened_again()
    {
        var llm = new ScriptedLlmClient();
        ApiFactory factory = await TestApi.FactoryAsync(postgres, llm);
        await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Klub Seniora");
        HttpClient client = factory.CreateClient(TestApi.Cookies);
        HttpResponseMessage created = await client.PostAsJsonAsync("/api/problem-reports", Report(GeneralDescription));
        ProblemReportResponse? asked = await created.Content.ReadFromJsonAsync<ProblemReportResponse>();
        llm.Fail<InnovationRankingResult>();

        HttpResponseMessage answered = await client.SendAsync(Answers(asked!, ["Seniorów", "Od roku", "Nikt"]));
        ProblemReportResponse? unmatched = await answered.Content.ReadFromJsonAsync<ProblemReportResponse>();
        llm.Recover();
        HttpResponseMessage opened = await client.SendAsync(Open(asked!));
        ProblemReportResponse? matched = await opened.Content.ReadFromJsonAsync<ProblemReportResponse>();

        Assert.True(asked.AwaitsAnswers);
        Assert.Equal(HttpStatusCode.OK, answered.StatusCode);
        Assert.False(unmatched!.IsMatched);
        Assert.Equal("Seniorów", unmatched.ClarifyingQuestions[0].Answer);
        Assert.Equal(HttpStatusCode.OK, opened.StatusCode);
        Assert.True(matched!.IsMatched);
        Assert.Equal("Od roku", matched.ClarifyingQuestions[1].Answer);
    }

    [Fact]
    public async Task Answering_twice_at_once_never_fails_with_a_server_error()
    {
        var llm = new ScriptedLlmClient();
        ApiFactory factory = await TestApi.FactoryAsync(postgres, llm);
        await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Klub Seniora");
        HttpClient client = factory.CreateClient(TestApi.Cookies);
        HttpResponseMessage created = await client.PostAsJsonAsync("/api/problem-reports", Report(GeneralDescription));
        ProblemReportResponse? asked = await created.Content.ReadFromJsonAsync<ProblemReportResponse>();

        HttpResponseMessage[] answered = await Task.WhenAll(
            client.SendAsync(Answers(asked!, ["Seniorów"])),
            client.SendAsync(Answers(asked!, ["Seniorów"])));
        ProblemReportResponse? opened = await client.GetFromJsonAsync<ProblemReportResponse>($"/api/problem-reports/track/{asked!.TrackingCode}");

        Assert.All(answered, response => Assert.Contains(response.StatusCode, new[] { HttpStatusCode.OK, HttpStatusCode.Conflict }));
        Assert.Contains(answered, response => response.StatusCode == HttpStatusCode.OK);
        Assert.True(opened!.IsMatched);
    }

    [Fact]
    public async Task A_ranked_innovation_without_a_score_is_dropped_rather_than_scored_zero()
    {
        var llm = new ScriptedLlmClient();
        ApiFactory factory = await TestApi.FactoryAsync(postgres, llm);
        Guid innovationId = await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Klub Seniora");
        llm.Reshape = (_, answer) => answer is InnovationRankingResult
            ? new InnovationRankingResult([new RankedInnovation(innovationId, null, "Pasuje do samotności seniorów.", [], null)])
            : answer;
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage created = await client.PostAsJsonAsync("/api/problem-reports", Report(SpecificDescription));
        ProblemReportResponse? report = await created.Content.ReadFromJsonAsync<ProblemReportResponse>();

        Assert.True(report!.IsMatched);
        Assert.Empty(report.Matches);
    }

    [Fact]
    public async Task Without_embeddings_the_ranking_gets_the_whole_library()
    {
        var llm = new ScriptedLlmClient();
        ApiFactory factory = await TestApi.FactoryAsync(postgres, llm);
        for (int number = 1; number <= 40; number++)
        {
            await KnowledgeData.AddInnovationWithGenomeAsync(factory, $"Innowacja {number}");
        }

        HttpClient client = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage created = await client.PostAsJsonAsync("/api/problem-reports", Report(SpecificDescription));
        LlmPrompt ranking = llm.Prompts.Single(prompt => prompt.Instructions == PromptTemplates.Get(PromptTemplates.RankInnovations));
        InnovationRankingInput input = LlmJson.Deserialize<InnovationRankingInput>(ranking.Input);

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.Equal(40, input.Candidates.Count);
    }

    [Fact]
    public async Task Opening_reports_by_tracking_code_is_limited_per_client()
    {
        var llm = new ScriptedLlmClient();
        var settings = new Dictionary<string, string?> { ["RateLimiting:TrackingCode:PermitLimit"] = "2" };
        ApiFactory factory = await TestApi.FactoryAsync(postgres, llm, settings);
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage first = await client.GetAsync("/api/problem-reports/track/AAAA-BBBB");
        HttpResponseMessage second = await client.GetAsync("/api/problem-reports/track/AAAA-CCCC");
        HttpResponseMessage third = await client.GetAsync("/api/problem-reports/track/AAAA-DDDD");

        Assert.Equal(HttpStatusCode.NotFound, first.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, second.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, third.StatusCode);
    }

    private static CreateProblemReportRequest Report(string description)
    {
        return new CreateProblemReportRequest(description, null, SubmittedOnBehalf: false, Dictated: false, KeepOriginalDescription: false);
    }

    private static HttpRequestMessage Answers(ProblemReportResponse report, IReadOnlyList<string?> answers)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"/api/problem-reports/{report.Id}/answers")
        {
            Content = JsonContent.Create(new AnswerProblemReportQuestionsRequest(answers)),
        };
        request.Headers.Add(ProblemReportsController.TrackingCodeHeader, report.TrackingCode);

        return request;
    }

    private static HttpRequestMessage Open(ProblemReportResponse report)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, $"/api/problem-reports/{report.Id}");
        request.Headers.Add(ProblemReportsController.TrackingCodeHeader, report.TrackingCode);

        return request;
    }
}
