using System.Net;
using System.Net.Http.Json;
using Castor.Api.Features.ProblemReports;
using Castor.Api.Shared;

namespace Castor.Tests;

/// <summary>"Skrzynka zgłoszeń": the administrators see every report and move it forward or close it.</summary>
[Collection(PostgresCollection.Name)]
public sealed class InboxProblemReportsApiTests(PostgresFixture postgres)
{
    private const string Description =
        "Samotni seniorzy mieszkający w naszej wsi od wielu miesięcy nie mają świetlicy ani regularnych spotkań sąsiedzkich. "
        + "Brakuje transportu do miasta, wolontariuszy, opiekunek oraz zajęć ruchowych przez cały tydzień, a rodziny pracują daleko.";

    [Fact]
    public async Task A_visitors_report_reaches_the_inbox_which_residents_cannot_open()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        ProblemReportResponse report = await SendReportAsync(factory);
        HttpClient admin = await TestApi.AdminAsync(factory);
        HttpClient resident = await TestApi.SignInAsync(factory, "ada-inbox@example.com");

        List<InboxProblemReportSummaryResponse>? inbox = await admin.GetFromJsonAsync<List<InboxProblemReportSummaryResponse>>("/api/admin/problem-reports");
        List<InboxProblemReportSummaryResponse>? closed = await admin.GetFromJsonAsync<List<InboxProblemReportSummaryResponse>>(
            "/api/admin/problem-reports?status=CLOSED");
        HttpResponseMessage forbidden = await resident.GetAsync("/api/admin/problem-reports");

        InboxProblemReportSummaryResponse row = Assert.Single(inbox!);
        Assert.Equal(report.Id, row.Id);
        Assert.Equal("RECEIVED", row.Status);
        Assert.Empty(closed!);
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);
    }

    [Fact]
    public async Task An_administrator_moves_a_report_forward_or_closes_it_but_never_back()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        ProblemReportResponse report = await SendReportAsync(factory);
        HttpClient admin = await TestApi.AdminAsync(factory);
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);
        string move = $"/api/admin/problem-reports/{report.Id}/move";

        HttpResponseMessage withExpert = await admin.PostAsJsonAsync(move, new MoveProblemReportRequest("WITH_EXPERT"));
        HttpResponseMessage back = await admin.PostAsJsonAsync(move, new MoveProblemReportRequest("RECEIVED"));
        HttpResponseMessage closed = await admin.PostAsJsonAsync(move, new MoveProblemReportRequest("CLOSED"));
        HttpResponseMessage afterClosing = await admin.PostAsJsonAsync(move, new MoveProblemReportRequest("ANSWERED"));
        ProblemReportResponse? tracked = await visitor.GetFromJsonAsync<ProblemReportResponse>($"/api/problem-reports/track/{report.TrackingCode}");

        Assert.Equal(HttpStatusCode.OK, withExpert.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, back.StatusCode);
        Assert.Equal(HttpStatusCode.OK, closed.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, afterClosing.StatusCode);
        Assert.Equal("CLOSED", tracked!.Status);
    }

    [Fact]
    public async Task Opening_a_report_whose_matching_failed_matches_it_for_the_administrator()
    {
        var llm = new ScriptedLlmClient();
        llm.Fail<InnovationRankingResult>();
        ApiFactory factory = await TestApi.FactoryAsync(postgres, llm);
        await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Klub Seniora");
        ProblemReportResponse report = await SendReportAsync(factory);
        HttpClient admin = await TestApi.AdminAsync(factory);
        llm.Recover();

        InboxProblemReportResponse? opened = await admin.GetFromJsonAsync<InboxProblemReportResponse>($"/api/admin/problem-reports/{report.Id}");

        Assert.False(report.IsMatched);
        Assert.True(opened!.Report.IsMatched);
        Assert.Equal("Klub Seniora", Assert.Single(opened.Report.Matches).Title);
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
}
