using System.Net;
using System.Net.Http.Json;
using Castor.Api.Features.Ideas;

namespace Castor.Tests;

/// <summary>Szkółka: an idea starts as a private draft and is sent to ROPS once the card says what, for whom and why.</summary>
[Collection(PostgresCollection.Name)]
public sealed class IdeaSubmissionApiTests(PostgresFixture postgres)
{
    [Fact]
    public async Task A_draft_names_what_it_lacks_and_cannot_be_submitted_until_complete()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        HttpClient author = await TestApi.SignInAsync(factory, "ada-draft@example.com");

        HttpResponseMessage created = await author.PostAsJsonAsync("/api/ideas", TitleOnly("Wspólne obiady dla seniorów"));
        IdeaResponse? draft = await created.Content.ReadFromJsonAsync<IdeaResponse>();
        HttpResponseMessage submitted = await author.PostAsync($"/api/ideas/{draft!.Id}/submit", null);

        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        Assert.Equal("DRAFT", draft.Status);
        Assert.Equal(
            ["challengeAreaCodes", "problemIntensity", "problemFrequency", "problemScale", "recipients", "solution"],
            draft.MissingForSubmission);
        Assert.Equal(HttpStatusCode.BadRequest, submitted.StatusCode);
    }

    [Fact]
    public async Task A_complete_idea_is_submitted_after_the_duplicate_check()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        await KnowledgeData.AddChallengeAreaAsync(factory, "SENIORS", 8);
        await KnowledgeData.AddInnovationWithGenomeAsync(factory, "Klub Seniora");
        HttpClient author = await TestApi.SignInAsync(factory, "ada-submit@example.com");

        HttpResponseMessage created = await author.PostAsJsonAsync("/api/ideas", Complete("Wspólne obiady dla seniorów"));
        IdeaResponse? draft = await created.Content.ReadFromJsonAsync<IdeaResponse>();
        HttpResponseMessage submitted = await author.PostAsync($"/api/ideas/{draft!.Id}/submit", null);
        IdeaResponse? idea = await submitted.Content.ReadFromJsonAsync<IdeaResponse>();
        HttpResponseMessage submittedAgain = await author.PostAsync($"/api/ideas/{draft.Id}/submit", null);

        Assert.Empty(draft.MissingForSubmission);
        Assert.Equal(HttpStatusCode.OK, submitted.StatusCode);
        Assert.Equal("SUBMITTED", idea!.Status);
        Assert.NotNull(idea.SubmittedAt);
        Assert.True(idea.SimilarIsCurrent);
        Assert.Equal(HttpStatusCode.Conflict, submittedAgain.StatusCode);
    }

    [Fact]
    public async Task A_draft_is_hidden_from_everyone_but_its_author()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        HttpClient author = await TestApi.SignInAsync(factory, "ada-hidden@example.com");
        HttpClient someoneElse = await TestApi.SignInAsync(factory, "jan-hidden@example.com");

        HttpResponseMessage created = await author.PostAsJsonAsync("/api/ideas", TitleOnly("Mój szkic"));
        IdeaResponse? draft = await created.Content.ReadFromJsonAsync<IdeaResponse>();
        HttpResponseMessage peeked = await someoneElse.GetAsync($"/api/ideas/{draft!.Id}");
        List<IdeaSummaryResponse>? mine = await author.GetFromJsonAsync<List<IdeaSummaryResponse>>("/api/ideas");

        Assert.Equal(HttpStatusCode.NotFound, peeked.StatusCode);
        Assert.Equal(draft.Id, Assert.Single(mine!).Id);
    }

    [Fact]
    public async Task An_unknown_challenge_area_or_recipient_is_refused()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        await KnowledgeData.AddChallengeAreaAsync(factory, "SENIORS", 8);
        HttpClient author = await TestApi.SignInAsync(factory, "ada-unknown@example.com");

        HttpResponseMessage unknownArea = await author.PostAsJsonAsync("/api/ideas", Complete("Pomysł") with { ChallengeAreaCodes = ["NOPE"] });
        HttpResponseMessage unknownRecipient = await author.PostAsJsonAsync("/api/ideas", Complete("Pomysł") with { Recipients = ["ALIENS"] });

        Assert.Equal(HttpStatusCode.BadRequest, unknownArea.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, unknownRecipient.StatusCode);
    }

    private static CreateIdeaRequest TitleOnly(string title)
    {
        return new CreateIdeaRequest(title, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
    }

    private static CreateIdeaRequest Complete(string title)
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
}
