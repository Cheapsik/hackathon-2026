using System.Net;
using System.Net.Http.Json;
using Castor.Api.Features.BackgroundJobs;
using Castor.Api.Features.Feedback;
using Castor.Api.Features.FitAssessments;
using Castor.Api.Features.Ideas;
using Castor.Api.Features.Innovations;
using Castor.Api.Features.Municipalities;
using Castor.Api.Features.ProblemReports;
using Castor.Api.Features.Register;
using Castor.Api.Features.Session;
using Castor.Api.Features.SignIn;
using Castor.Api.Features.Tests;
using Castor.Api.Features.TesterProfile;

namespace Castor.Tests;

/// <summary>
/// The basic journeys through the API, end to end — each one complete: it registers or signs in (the administrator
/// too), adds the data it needs and walks the whole path. Run one with "Debug Test" and set breakpoints in the API's
/// handlers; no running API, seed or manual step is needed.
/// </summary>
[Collection(PostgresCollection.Name)]
public sealed class UsageScenarioTests(PostgresFixture postgres)
{
    /// <summary>Too general for the placeholder model, which asks three clarifying questions.</summary>
    private const string GeneralDescription = "Seniorzy w gminie są samotni i bez wsparcia.";

    private static readonly TimeSpan JobTimeout = TimeSpan.FromSeconds(30);

    [Fact]
    public async Task Scenario_01_a_visitor_describes_a_problem_answers_the_questions_and_tracks_it()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Klub Seniora");
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);

        // 1. "Opisz problem" without an account.
        HttpResponseMessage created = await visitor.PostAsJsonAsync("/api/problem-reports", Report(GeneralDescription));
        ProblemReportResponse? asked = await created.Content.ReadFromJsonAsync<ProblemReportResponse>();

        // 2. The answers to the clarifying questions; the tracking code proves access.
        var answers = new HttpRequestMessage(HttpMethod.Post, $"/api/problem-reports/{asked!.Id}/answers")
        {
            Content = JsonContent.Create(new AnswerProblemReportQuestionsRequest(["Osoby 75+ mieszkające same", "Od kilku lat", "Nikt"])),
        };
        answers.Headers.Add(ProblemReportsController.TrackingCodeHeader, asked.TrackingCode);
        HttpResponseMessage answered = await visitor.SendAsync(answers);

        // 3. "Śledź zgłoszenie" by the code alone.
        ProblemReportResponse? tracked = await visitor.GetFromJsonAsync<ProblemReportResponse>($"/api/problem-reports/track/{asked.TrackingCode}");

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.True(asked.AwaitsAnswers);
        Assert.Equal(3, asked.ClarifyingQuestions.Count);
        Assert.Equal(HttpStatusCode.OK, answered.StatusCode);
        Assert.True(tracked!.IsMatched);
        Assert.Equal("Klub Seniora", Assert.Single(tracked.Matches).Title);
        Assert.Equal("RECEIVED", tracked.Status);
    }

    [Fact]
    public async Task Scenario_02_a_resident_registers_signs_out_and_signs_in_again()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage registered = await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("ada-scenario@example.com", "password1"));
        SessionResponse? afterRegistering = await client.GetFromJsonAsync<SessionResponse>("/api/auth/session");
        HttpResponseMessage signedOut = await client.PostAsync("/api/auth/sign-out", null);
        SessionResponse? afterSigningOut = await client.GetFromJsonAsync<SessionResponse>("/api/auth/session");
        HttpResponseMessage signedIn = await client.PostAsJsonAsync("/api/auth/sign-in", new SignInRequest("ada-scenario@example.com", "password1"));
        SessionResponse? afterSigningIn = await client.GetFromJsonAsync<SessionResponse>("/api/auth/session");

        Assert.Equal(HttpStatusCode.Created, registered.StatusCode);
        Assert.True(afterRegistering!.SignedIn);
        Assert.Equal(HttpStatusCode.NoContent, signedOut.StatusCode);
        Assert.False(afterSigningOut!.SignedIn);
        Assert.Equal(HttpStatusCode.OK, signedIn.StatusCode);
        Assert.Equal("ada-scenario@example.com", afterSigningIn!.Email);
        Assert.Equal("RESIDENT", afterSigningIn.Role);
    }

    [Fact]
    public async Task Scenario_03_a_visitor_takes_an_anonymous_report_into_a_new_account()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        HttpClient client = factory.CreateClient(TestApi.Cookies);

        // 1. A report sent before having an account.
        HttpResponseMessage created = await client.PostAsJsonAsync("/api/problem-reports", Report(GeneralDescription));
        ProblemReportResponse? anonymous = await created.Content.ReadFromJsonAsync<ProblemReportResponse>();

        // 2. The same browser registers and claims the report with its code.
        (await client.PostAsJsonAsync("/api/auth/register", new RegisterRequest("ada-claim-scenario@example.com", "password1"))).EnsureSuccessStatusCode();
        HttpResponseMessage claimed = await client.PostAsJsonAsync("/api/problem-reports/claim", new ClaimProblemReportRequest(anonymous!.TrackingCode));

        // 3. "Moje zgłoszenia".
        List<ProblemReportSummaryResponse>? mine = await client.GetFromJsonAsync<List<ProblemReportSummaryResponse>>("/api/problem-reports/mine");

        Assert.False(anonymous.HasAuthor);
        Assert.Equal(HttpStatusCode.OK, claimed.StatusCode);
        Assert.Equal(anonymous.Id, Assert.Single(mine!).Id);
    }

    [Fact]
    public async Task Scenario_04_a_visitor_browses_the_atlas_and_opens_an_innovation()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        ChallengeArea seniors = await KnowledgeData.AddChallengeAreaAsync(factory, "SENIORS", 8);
        await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Klub Seniora", seniors);
        await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Świetlica sąsiedzka");
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);

        List<InnovationSummaryResponse>? found = await visitor.GetFromJsonAsync<List<InnovationSummaryResponse>>(
            "/api/innovations?search=klub&challengeArea=SENIORS");
        InnovationSummaryResponse summary = Assert.Single(found!);
        InnovationResponse? card = await visitor.GetFromJsonAsync<InnovationResponse>($"/api/innovations/{summary.Id}");

        Assert.Equal("Klub Seniora", card!.Title);
        Assert.Equal(["SENIORS"], card.ChallengeAreaCodes);
        Assert.NotNull(card.Solution);
    }

    [Fact]
    public async Task Scenario_05_a_visitor_finds_a_gmina_and_reads_its_obserwator_profile()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        _ = await GminyWithDataAsync(factory);
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);

        List<MunicipalityResponse>? found = await visitor.GetFromJsonAsync<List<MunicipalityResponse>>("/api/municipalities?search=bob");
        MunicipalityResponse gmina = Assert.Single(found!);
        MunicipalityProfileResponse? profile = await visitor.GetFromJsonAsync<MunicipalityProfileResponse>(
            $"/api/municipalities/{gmina.Teryt}/profile?challengeArea=SENIORS");

        Assert.Equal("Bobowa", gmina.Name);
        Assert.Equal(2, profile!.Indicators.Count);
        ProfileIndicatorResponse elderly = Assert.Single(profile.Indicators, indicator => indicator.General);
        Assert.Equal(20m, elderly.Value);
        Assert.Equal(25m, elderly.RegionAverage);
    }

    [Fact]
    public async Task Scenario_06_a_resident_generates_a_fit_card_which_a_visitor_then_reads()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        (string teryt, ChallengeArea seniors) = await GminyWithDataAsync(factory);
        Guid innovationId = await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Klub Seniora", seniors);
        HttpClient resident = await TestApi.SignInAsync(factory, "ada-fit-scenario@example.com");
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage generated = await resident.PostAsJsonAsync($"/api/innovations/{innovationId}/fit", new CreateFitAssessmentRequest(teryt));
        FitAssessmentResponse? card = await generated.Content.ReadFromJsonAsync<FitAssessmentResponse>();
        FitAssessmentResponse? read = await visitor.GetFromJsonAsync<FitAssessmentResponse>($"/api/innovations/{innovationId}/fit?teryt={teryt}");

        Assert.Equal(HttpStatusCode.Created, generated.StatusCode);
        Assert.Equal(teryt, card!.Municipality.Teryt);
        Assert.Equal(2023, card.DataYear);
        Assert.False(string.IsNullOrWhiteSpace(card.Summary));
        Assert.Equal(card.Id, read!.Id);
    }

    [Fact]
    public async Task Scenario_07_a_resident_writes_an_idea_in_the_kreator_and_submits_it()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        await KnowledgeData.AddChallengeAreaAsync(factory, "SENIORS", 8);
        await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Klub Seniora");
        HttpClient author = await TestApi.SignInAsync(factory, "ada-idea-scenario@example.com");

        // 1. The Canvas choices the Kreator shows.
        IdeaCanvasResponse? canvas = await author.GetFromJsonAsync<IdeaCanvasResponse>("/api/ideas/canvas");

        // 2. A draft, 3. sent to ROPS after the duplicate check, 4. in "Moje pomysły".
        HttpResponseMessage created = await author.PostAsJsonAsync("/api/ideas", CompleteIdea("Wspólne obiady dla seniorów"));
        IdeaResponse? draft = await created.Content.ReadFromJsonAsync<IdeaResponse>();
        HttpResponseMessage submitted = await author.PostAsync($"/api/ideas/{draft!.Id}/submit", null);
        IdeaResponse? idea = await submitted.Content.ReadFromJsonAsync<IdeaResponse>();
        List<IdeaSummaryResponse>? mine = await author.GetFromJsonAsync<List<IdeaSummaryResponse>>("/api/ideas");

        Assert.Contains(canvas!.Recipients, option => option.Code == "SENIORS");
        Assert.Equal("DRAFT", draft.Status);
        Assert.Equal("SUBMITTED", idea!.Status);
        Assert.True(idea.SimilarIsCurrent);
        Assert.Equal("SUBMITTED", Assert.Single(mine!).Status);
    }

    [Fact]
    public async Task Scenario_08_an_author_opens_an_idea_to_testers_and_a_tester_signs_up()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        IReadOnlyList<string> teryts = await KnowledgeData.AddMunicipalitiesAsync(factory, "Bobowa");
        await KnowledgeData.AddChallengeAreaAsync(factory, "SENIORS", 8);
        HttpClient author = await TestApi.SignInAsync(factory, "ada-author-scenario@example.com");
        HttpClient tester = await TestApi.SignInAsync(factory, "jan-tester-scenario@example.com");

        // 1. The author submits a prototype and turns "szuka testerów" on.
        HttpResponseMessage created = await author.PostAsJsonAsync("/api/ideas", CompleteIdea("Wspólne obiady dla seniorów"));
        IdeaResponse? idea = await created.Content.ReadFromJsonAsync<IdeaResponse>();
        (await author.PostAsync($"/api/ideas/{idea!.Id}/submit", null)).EnsureSuccessStatusCode();
        HttpResponseMessage opened = await author.PutAsJsonAsync($"/api/ideas/{idea.Id}/seeks-testers", new SetSeeksTestersRequest(true));

        // 2. The tester fills in the profile once and signs up on Poletko.
        HttpResponseMessage profile = await tester.PutAsJsonAsync("/api/me/tester-profile", new SaveTesterProfileRequest(67, teryts[0], "Słabo widzę", "Smartfon"));
        HttpResponseMessage signedUp = await tester.PostAsJsonAsync($"/api/tests/{idea.Id}/signups", new CreateTestSignupRequest("IDEA"));
        List<TestOpportunityResponse>? tests = await tester.GetFromJsonAsync<List<TestOpportunityResponse>>("/api/tests");

        Assert.Equal(HttpStatusCode.OK, opened.StatusCode);
        Assert.Equal(HttpStatusCode.OK, profile.StatusCode);
        Assert.Equal(HttpStatusCode.Created, signedUp.StatusCode);
        TestOpportunityResponse test = Assert.Single(tests!);
        Assert.Equal("IDEA", test.Kind);
        Assert.True(test.SignedUp);
    }

    [Fact]
    public async Task Scenario_09_an_administrator_moves_a_report_from_the_inbox_and_the_visitor_sees_it()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);
        HttpResponseMessage created = await visitor.PostAsJsonAsync("/api/problem-reports", Report(GeneralDescription));
        ProblemReportResponse? report = await created.Content.ReadFromJsonAsync<ProblemReportResponse>();
        HttpClient admin = await TestApi.AdminAsync(factory);

        List<InboxProblemReportSummaryResponse>? inbox = await admin.GetFromJsonAsync<List<InboxProblemReportSummaryResponse>>(
            "/api/admin/problem-reports?status=RECEIVED");
        HttpResponseMessage moved = await admin.PostAsJsonAsync(
            $"/api/admin/problem-reports/{report!.Id}/move",
            new MoveProblemReportRequest("WITH_EXPERT"));
        ProblemReportResponse? tracked = await visitor.GetFromJsonAsync<ProblemReportResponse>($"/api/problem-reports/track/{report.TrackingCode}");

        Assert.Equal(report.Id, Assert.Single(inbox!).Id);
        Assert.Equal(HttpStatusCode.OK, moved.StatusCode);
        Assert.Equal("WITH_EXPERT", tracked!.Status);
    }

    [Fact]
    public async Task Scenario_10_an_administrator_generates_the_missing_genomes_in_the_background()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        await KnowledgeData.AddInnovationsWithoutGenomeAsync(factory, "Alfa", "Beta");
        HttpClient admin = await TestApi.AdminAsync(factory);

        HttpResponseMessage queued = await admin.PostAsync("/api/admin/jobs/genomes", null);
        BackgroundJobResponse job = await WaitForFinishedJobAsync(admin);
        List<InnovationSummaryResponse>? library = await admin.GetFromJsonAsync<List<InnovationSummaryResponse>>("/api/innovations");

        Assert.Equal(HttpStatusCode.Accepted, queued.StatusCode);
        Assert.Equal("SUCCEEDED", job.Status);
        Assert.Equal(2, job.Done);
        Assert.All(library!, innovation => Assert.True(innovation.HasGenome));
    }

    private static CreateProblemReportRequest Report(string description)
    {
        return new CreateProblemReportRequest(description, null, SubmittedOnBehalf: false, Dictated: false, KeepOriginalDescription: false);
    }

    private static CreateIdeaRequest CompleteIdea(string title)
    {
        return new CreateIdeaRequest(
            title,
            ["SENIORS"],
            ProblemIntensity: 3,
            ProblemFrequency: 4,
            ProblemScale: 2,
            ["SENIORS"],
            null,
            "Raz w tygodniu sąsiedzi gotują obiad w świetlicy i jedzą go razem z samotnymi seniorami.",
            "PROTOTYPE",
            "Koło Gospodyń Wiejskich",
            null,
            ["LESS_LONELINESS"],
            [],
            null,
            null);
    }

    /// <summary>
    /// Bobowa and Biecz with a general indicator (20 and 30 in 2023) and a senior indicator published per powiat;
    /// returns the TERYT of Bobowa and the senior challenge area.
    /// </summary>
    private static async Task<(string Teryt, ChallengeArea Seniors)> GminyWithDataAsync(ApiFactory factory)
    {
        ChallengeArea seniors = await KnowledgeData.AddChallengeAreaAsync(factory, "SENIORS", 8);
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

        return (teryts[0], seniors);
    }

    private static async Task<BackgroundJobResponse> WaitForFinishedJobAsync(HttpClient admin)
    {
        DateTimeOffset deadline = DateTimeOffset.UtcNow + JobTimeout;
        while (DateTimeOffset.UtcNow < deadline)
        {
            List<BackgroundJobResponse>? jobs = await admin.GetFromJsonAsync<List<BackgroundJobResponse>>("/api/admin/jobs");
            BackgroundJobResponse? finished = jobs!.FirstOrDefault(job => job.Status is "SUCCEEDED" or "FAILED");
            if (finished is not null)
            {
                return finished;
            }

            await Task.Delay(TimeSpan.FromMilliseconds(200));
        }

        throw new TimeoutException($"No genome job finished within {JobTimeout.TotalSeconds} seconds.");
    }
}
