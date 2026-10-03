using System.Net;
using System.Net.Http.Json;
using Castor.Api.Features.Conversations;
using Castor.Api.Features.GrantCalls;
using Castor.Api.Features.Ideas;
using Castor.Api.Features.ProblemReports;
using Castor.Api.Features.Radar;
using Castor.Api.Features.SignIn;
using Castor.Api.Features.Tests;
using Microsoft.Extensions.DependencyInjection;

namespace Castor.Tests;

/// <summary>
/// The committed data/seed with demo_content.json, imported as the demo starts: every module has something to show,
/// the demo accounts sign in, and a restart adds nothing twice.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class DemoContentImportTests(PostgresFixture postgres)
{
    private const string DemoPassword = "demo-password1";

    [Fact]
    public async Task A_fresh_demo_has_something_on_every_screen_a_judge_opens_first()
    {
        await using ApiFactory factory = await DemoAsync();
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);
        HttpClient admin = await SignInAsync(factory, "rops.demo@example.com");
        HttpClient expert = await SignInAsync(factory, "ekspert.demo@example.com");
        HttpClient resident = await SignInAsync(factory, "mieszkanka.demo@example.com");
        HttpClient officer = await SignInAsync(factory, "gmina.demo@example.com");

        List<TestOpportunityResponse>? poletko = await visitor.GetFromJsonAsync<List<TestOpportunityResponse>>("/api/tests");
        List<GrantCallResponse>? openCalls = await visitor.GetFromJsonAsync<List<GrantCallResponse>>("/api/grant-calls?open=true");
        List<InboxProblemReportSummaryResponse>? inbox = await admin.GetFromJsonAsync<List<InboxProblemReportSummaryResponse>>("/api/admin/problem-reports");
        RadarResponse? radar = await admin.GetFromJsonAsync<RadarResponse>("/api/admin/radar");
        List<IdeaSummaryResponse>? forReview = await expert.GetFromJsonAsync<List<IdeaSummaryResponse>>("/api/ideas/for-review");
        List<ProblemReportSummaryResponse>? residentReports = await resident.GetFromJsonAsync<List<ProblemReportSummaryResponse>>("/api/problem-reports/mine");
        List<ConversationSummaryResponse>? officerThreads = await officer.GetFromJsonAsync<List<ConversationSummaryResponse>>("/api/conversations");

        Assert.Equal(3, poletko!.Count);
        Assert.Contains(poletko, test => test.Title == "Sąsiedzki telefon dla samotnych seniorów");
        Assert.Single(openCalls!);
        Assert.Equal(14, inbox!.Count);
        Assert.True(radar!.Reports > 0);
        Assert.NotEmpty(radar.ByArea);
        Assert.NotEmpty(forReview!);
        Assert.Equal(2, residentReports!.Count);
        Assert.Contains(officerThreads!, thread => thread.Kind == "PARTNERSHIP");
        Assert.Contains(officerThreads!, thread => thread.Kind == "EXPERT_QUESTION");
    }

    [Fact]
    public async Task A_demo_report_is_matched_when_the_administrator_opens_it()
    {
        await using ApiFactory factory = await DemoAsync();
        HttpClient admin = await SignInAsync(factory, "rops.demo@example.com");
        List<InboxProblemReportSummaryResponse>? inbox = await admin.GetFromJsonAsync<List<InboxProblemReportSummaryResponse>>("/api/admin/problem-reports");

        InboxProblemReportResponse? opened = await admin.GetFromJsonAsync<InboxProblemReportResponse>($"/api/admin/problem-reports/{inbox![0].Id}");

        Assert.False(inbox[0].IsMatched);
        Assert.True(opened!.Report.IsMatched);
    }

    [Fact]
    public async Task Importing_the_demo_again_adds_nothing()
    {
        await using ApiFactory factory = await DemoAsync();
        HttpClient admin = await SignInAsync(factory, "rops.demo@example.com");

        await using (AsyncServiceScope scope = factory.Services.CreateAsyncScope())
        {
            DemoContentImporter importer = scope.ServiceProvider.GetRequiredService<DemoContentImporter>();
            await importer.ImportAsync(SeedPath(), DemoPassword, CancellationToken.None);
        }

        List<InboxProblemReportSummaryResponse>? inbox = await admin.GetFromJsonAsync<List<InboxProblemReportSummaryResponse>>("/api/admin/problem-reports");
        Assert.Equal(14, inbox!.Count);
    }

    [Fact]
    public async Task Demo_content_without_a_password_stops_the_start_up()
    {
        string connectionString = await postgres.CreateMigratedDatabaseAsync();
        await using var factory = new ApiFactory(connectionString, DemoSettings(password: null));

        Exception? startUp = Record.Exception(() => factory.CreateClient());

        Assert.NotNull(startUp);
        Assert.Contains("password", startUp.ToString(), StringComparison.OrdinalIgnoreCase);
    }

    private async Task<ApiFactory> DemoAsync()
    {
        string connectionString = await postgres.CreateMigratedDatabaseAsync();
        return new ApiFactory(connectionString, DemoSettings(DemoPassword));
    }

    private static Dictionary<string, string?> DemoSettings(string? password)
    {
        return new Dictionary<string, string?>
        {
            ["Seed:OnStartup"] = "true",
            ["Seed:Path"] = SeedPath(),
            ["Seed:DemoContent"] = "true",
            ["Seed:DemoPassword"] = password,
        };
    }

    private static async Task<HttpClient> SignInAsync(ApiFactory factory, string email)
    {
        HttpClient client = factory.CreateClient(TestApi.Cookies);
        HttpResponseMessage signedIn = await client.PostAsJsonAsync("/api/auth/sign-in", new SignInRequest(email, DemoPassword));
        Assert.Equal(HttpStatusCode.OK, signedIn.StatusCode);

        return client;
    }

    /// <summary>The repository's data/seed, found upwards from the test binaries.</summary>
    private static string SeedPath()
    {
        DirectoryInfo? directory = new(AppContext.BaseDirectory);
        while (directory is not null)
        {
            string candidate = Path.Combine(directory.FullName, "data", "seed");
            if (File.Exists(Path.Combine(candidate, DemoContentImporter.FileName)))
            {
                return candidate;
            }

            directory = directory.Parent;
        }

        throw new DirectoryNotFoundException("data/seed with demo_content.json was not found above the test binaries.");
    }
}
