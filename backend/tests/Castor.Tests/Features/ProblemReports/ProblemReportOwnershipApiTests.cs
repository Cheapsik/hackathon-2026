using System.Net;
using System.Net.Http.Json;
using Castor.Api.Features.ProblemReports;

namespace Castor.Tests;

/// <summary>"Moje zgłoszenia": a report belongs to its signed-in author, or to whoever claims it first with its code.</summary>
[Collection(PostgresCollection.Name)]
public sealed class ProblemReportOwnershipApiTests(PostgresFixture postgres)
{
    private const string Description =
        "Samotni seniorzy mieszkający w naszej wsi od wielu miesięcy nie mają świetlicy ani regularnych spotkań sąsiedzkich. "
        + "Brakuje transportu do miasta, wolontariuszy, opiekunek oraz zajęć ruchowych przez cały tydzień, a rodziny pracują daleko.";

    [Fact]
    public async Task A_report_sent_while_signed_in_is_listed_among_the_authors_reports()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        HttpClient author = await TestApi.SignInAsync(factory, "ada-mine@example.com");
        HttpClient someoneElse = await TestApi.SignInAsync(factory, "jan-mine@example.com");

        HttpResponseMessage created = await author.PostAsJsonAsync("/api/problem-reports", Report());
        ProblemReportResponse? report = await created.Content.ReadFromJsonAsync<ProblemReportResponse>();
        List<ProblemReportSummaryResponse>? mine = await author.GetFromJsonAsync<List<ProblemReportSummaryResponse>>("/api/problem-reports/mine");
        List<ProblemReportSummaryResponse>? theirs = await someoneElse.GetFromJsonAsync<List<ProblemReportSummaryResponse>>("/api/problem-reports/mine");
        HttpResponseMessage peeked = await someoneElse.GetAsync($"/api/problem-reports/{report!.Id}");

        Assert.True(report.HasAuthor);
        Assert.Equal(report.Id, Assert.Single(mine!).Id);
        Assert.Empty(theirs!);
        Assert.Equal(HttpStatusCode.NotFound, peeked.StatusCode);
    }

    [Fact]
    public async Task An_anonymous_report_is_claimed_with_its_tracking_code_only_once()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);
        HttpResponseMessage created = await visitor.PostAsJsonAsync("/api/problem-reports", Report());
        ProblemReportResponse? anonymous = await created.Content.ReadFromJsonAsync<ProblemReportResponse>();
        HttpClient owner = await TestApi.SignInAsync(factory, "ada-claim@example.com");
        HttpClient latecomer = await TestApi.SignInAsync(factory, "jan-claim@example.com");

        // The code is typed as the visitor sees it: lower case, without the dash.
        string typedCode = anonymous!.TrackingCode.Replace("-", string.Empty, StringComparison.Ordinal).ToLowerInvariant();
        HttpResponseMessage claimed = await owner.PostAsJsonAsync("/api/problem-reports/claim", new ClaimProblemReportRequest(typedCode));
        ProblemReportResponse? owned = await claimed.Content.ReadFromJsonAsync<ProblemReportResponse>();
        List<ProblemReportSummaryResponse>? mine = await owner.GetFromJsonAsync<List<ProblemReportSummaryResponse>>("/api/problem-reports/mine");
        HttpResponseMessage claimedAgain = await latecomer.PostAsJsonAsync("/api/problem-reports/claim", new ClaimProblemReportRequest(anonymous.TrackingCode));

        Assert.False(anonymous.HasAuthor);
        Assert.Equal(HttpStatusCode.OK, claimed.StatusCode);
        Assert.True(owned!.HasAuthor);
        Assert.Equal(anonymous.Id, Assert.Single(mine!).Id);
        Assert.Equal(HttpStatusCode.Conflict, claimedAgain.StatusCode);
    }

    [Fact]
    public async Task A_malformed_code_is_refused_and_an_unknown_one_is_not_found()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        HttpClient user = await TestApi.SignInAsync(factory, "ada-bad-code@example.com");

        HttpResponseMessage malformed = await user.PostAsJsonAsync("/api/problem-reports/claim", new ClaimProblemReportRequest("ABC"));
        HttpResponseMessage unknown = await user.PostAsJsonAsync("/api/problem-reports/claim", new ClaimProblemReportRequest("AAAA-BBBB"));

        Assert.Equal(HttpStatusCode.BadRequest, malformed.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, unknown.StatusCode);
    }

    private static CreateProblemReportRequest Report()
    {
        return new CreateProblemReportRequest(Description, null, SubmittedOnBehalf: false, Dictated: false, KeepOriginalDescription: false);
    }
}
