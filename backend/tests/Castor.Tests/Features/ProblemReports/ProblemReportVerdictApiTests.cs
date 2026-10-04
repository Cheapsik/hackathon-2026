using System.Net;
using System.Net.Http.Json;
using Castor.Api.Features.ProblemReports;

namespace Castor.Tests;

/// <summary>
/// "Czy to spełnia Twoją potrzebę?" (docs/features.md §1): one verdict — no, yes, almost — under a similar report and
/// under a matched innovation. Yes on a similar report joins its case instead of keeping a duplicate.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class ProblemReportVerdictApiTests(PostgresFixture postgres)
{
    private const string Description =
        "Samotni seniorzy mieszkający w naszej wsi od wielu miesięcy nie mają świetlicy ani regularnych spotkań sąsiedzkich. "
        + "Brakuje transportu do miasta, wolontariuszy, opiekunek oraz zajęć ruchowych przez cały tydzień, a rodziny pracują daleko.";

    [Fact]
    public async Task Yes_on_a_similar_report_joins_its_case_which_the_inbox_shows_once_with_the_count()
    {
        ApiFactory factory = await FactoryWithSeniorsAreaAsync();
        ProblemReportResponse first = await SendReportAsync(factory);
        ProblemReportResponse second = await SendReportAsync(factory);
        HttpClient admin = await TestApi.AdminAsync(factory);
        HttpClient stranger = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage peeked = await stranger.SendAsync(DecideOnSimilar(second.Id, first.Id, null, new DecideOnSimilarProblemReportRequest("YES", null)));
        HttpResponseMessage joined = await factory.CreateClient(TestApi.Cookies).SendAsync(
            DecideOnSimilar(second.Id, first.Id, second.TrackingCode, new DecideOnSimilarProblemReportRequest("YES", null)));
        ProblemReportResponse? joinedReport = await joined.Content.ReadFromJsonAsync<ProblemReportResponse>();
        ProblemReportResponse? firstTracked = await stranger.GetFromJsonAsync<ProblemReportResponse>($"/api/problem-reports/track/{first.TrackingCode}");
        List<InboxProblemReportSummaryResponse>? inbox = await admin.GetFromJsonAsync<List<InboxProblemReportSummaryResponse>>("/api/admin/problem-reports");

        Assert.Equal(first.Id, Assert.Single(second.SimilarReports.Items).Id);
        Assert.Equal(HttpStatusCode.NotFound, peeked.StatusCode);
        Assert.Equal(HttpStatusCode.OK, joined.StatusCode);
        Assert.Equal(first.Id, joinedReport!.JoinedCase!.Id);
        Assert.Equal(first.Description, joinedReport.JoinedCase.Description);
        Assert.Equal(1, joinedReport.JoinedCase.JoinedCount);
        Assert.Equal(1, firstTracked!.JoinedCount);
        InboxProblemReportSummaryResponse row = Assert.Single(inbox!);
        Assert.Equal(first.Id, row.Id);
        Assert.Equal(1, row.JoinedCount);
    }

    [Fact]
    public async Task Almost_needs_a_note_and_keeps_the_report_as_a_case_of_its_own()
    {
        ApiFactory factory = await FactoryWithSeniorsAreaAsync();
        ProblemReportResponse first = await SendReportAsync(factory);
        ProblemReportResponse second = await SendReportAsync(factory);
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);
        HttpClient admin = await TestApi.AdminAsync(factory);

        HttpResponseMessage withoutNote = await visitor.SendAsync(
            DecideOnSimilar(second.Id, first.Id, second.TrackingCode, new DecideOnSimilarProblemReportRequest("ALMOST", "  ")));
        HttpResponseMessage almost = await visitor.SendAsync(
            DecideOnSimilar(second.Id, first.Id, second.TrackingCode, new DecideOnSimilarProblemReportRequest("ALMOST", "U nas brakuje też transportu do przychodni.")));
        ProblemReportResponse? decided = await almost.Content.ReadFromJsonAsync<ProblemReportResponse>();
        List<InboxProblemReportSummaryResponse>? inbox = await admin.GetFromJsonAsync<List<InboxProblemReportSummaryResponse>>("/api/admin/problem-reports");

        Assert.Equal(HttpStatusCode.BadRequest, withoutNote.StatusCode);
        Assert.Equal(HttpStatusCode.OK, almost.StatusCode);
        Assert.Null(decided!.JoinedCase);
        Assert.Equal("ALMOST", Assert.Single(decided.SimilarReports.Items).Verdict);
        Assert.Equal(2, inbox!.Count);
    }

    [Fact]
    public async Task A_verdict_on_a_matched_innovation_is_kept_with_the_match()
    {
        ApiFactory factory = await FactoryWithSeniorsAreaAsync();
        Guid innovationId = await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Klub Seniora");
        ProblemReportResponse report = await SendReportAsync(factory);
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage helped = await visitor.SendAsync(
            DecideOnMatch(report.Id, innovationId, report.TrackingCode, new DecideOnMatchRequest("YES", null)));
        ProblemReportResponse? decided = await helped.Content.ReadFromJsonAsync<ProblemReportResponse>();

        Assert.Null(Assert.Single(report.Matches).Verdict);
        Assert.Equal(HttpStatusCode.OK, helped.StatusCode);
        Assert.Equal("YES", Assert.Single(decided!.Matches).Verdict);
    }

    /// <summary>The placeholder model puts a report in the area whose name shares its words.</summary>
    private async Task<ApiFactory> FactoryWithSeniorsAreaAsync()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        var area = ChallengeArea.Import("SENIORZY", 1, "Samotni seniorzy", "Seniorzy bez spotkań sąsiedzkich i transportu.", [], "test", DateTimeOffset.UtcNow);
        await TestApi.WithDatabaseAsync(factory, async db =>
        {
            db.ChallengeAreas.Add(area);
            await db.SaveChangesAsync();
        });

        return factory;
    }

    private static async Task<ProblemReportResponse> SendReportAsync(ApiFactory factory)
    {
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);
        var request = new CreateProblemReportRequest(Description, null, SubmittedOnBehalf: false, Dictated: false, KeepOriginalDescription: false);
        HttpResponseMessage created = await visitor.PostAsJsonAsync("/api/problem-reports", request);
        created.EnsureSuccessStatusCode();

        ProblemReportResponse? report = await created.Content.ReadFromJsonAsync<ProblemReportResponse>();
        return report!;
    }

    private static HttpRequestMessage DecideOnSimilar(
        Guid reportId,
        Guid similarReportId,
        string? trackingCode,
        DecideOnSimilarProblemReportRequest body)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"/api/problem-reports/{reportId}/similar/{similarReportId}/verdict")
        {
            Content = JsonContent.Create(body),
        };
        if (trackingCode is not null)
        {
            request.Headers.Add(ProblemReportsController.TrackingCodeHeader, trackingCode);
        }

        return request;
    }

    private static HttpRequestMessage DecideOnMatch(Guid reportId, Guid innovationId, string trackingCode, DecideOnMatchRequest body)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"/api/problem-reports/{reportId}/matches/{innovationId}/verdict")
        {
            Content = JsonContent.Create(body),
        };
        request.Headers.Add(ProblemReportsController.TrackingCodeHeader, trackingCode);

        return request;
    }
}
