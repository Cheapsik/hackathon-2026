using System.Net;
using System.Net.Http.Json;
using Castor.Api.Features.Feedback;
using Castor.Api.Features.Innovations;
using Castor.Api.Features.Tests;
using Castor.Api.Features.TesterProfile;

namespace Castor.Tests;

/// <summary>Poletko: ROPS opens a prototype to testers, and a resident with a tester profile signs up once.</summary>
[Collection(PostgresCollection.Name)]
public sealed class TestSignupApiTests(PostgresFixture postgres)
{
    [Fact]
    public async Task Only_an_idea_or_a_prototype_looks_for_testers()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        Guid prototype = await KnowledgeData.AddInnovationAsync(factory, "Prototyp", InnovationStage.PROTOTYPE);
        Guid ready = await KnowledgeData.AddInnovationAsync(factory, "Gotowa", InnovationStage.READY);
        HttpClient admin = await TestApi.AdminAsync(factory);
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);

        HttpResponseMessage opened = await admin.PutAsJsonAsync($"/api/innovations/{prototype}/seeks-testers", new SetSeeksTestersRequest(true));
        InnovationResponse? card = await opened.Content.ReadFromJsonAsync<InnovationResponse>();
        HttpResponseMessage refused = await admin.PutAsJsonAsync($"/api/innovations/{ready}/seeks-testers", new SetSeeksTestersRequest(true));
        List<TestOpportunityResponse>? tests = await visitor.GetFromJsonAsync<List<TestOpportunityResponse>>("/api/tests");

        Assert.True(card!.SeeksTesters);
        Assert.Equal(HttpStatusCode.BadRequest, refused.StatusCode);
        TestOpportunityResponse test = Assert.Single(tests!);
        Assert.Equal(prototype, test.Id);
        Assert.Equal("INNOVATION", test.Kind);
        Assert.False(test.SignedUp);
    }

    [Fact]
    public async Task A_resident_without_the_admins_rights_cannot_open_an_innovation_to_testers()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        Guid prototype = await KnowledgeData.AddInnovationAsync(factory, "Prototyp", InnovationStage.PROTOTYPE);
        HttpClient resident = await TestApi.SignInAsync(factory, "ada-not-team@example.com");

        HttpResponseMessage response = await resident.PutAsJsonAsync($"/api/innovations/{prototype}/seeks-testers", new SetSeeksTestersRequest(true));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task A_tester_fills_in_the_profile_first_and_signs_up_only_once()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres);
        IReadOnlyList<string> teryts = await KnowledgeData.AddMunicipalitiesAsync(factory, "Bobowa");
        Guid prototype = await KnowledgeData.AddInnovationAsync(factory, "Prototyp", InnovationStage.PROTOTYPE);
        HttpClient admin = await TestApi.AdminAsync(factory);
        (await admin.PutAsJsonAsync($"/api/innovations/{prototype}/seeks-testers", new SetSeeksTestersRequest(true))).EnsureSuccessStatusCode();
        HttpClient tester = await TestApi.SignInAsync(factory, "ada-tester@example.com");
        var signup = new CreateTestSignupRequest("INNOVATION");

        HttpResponseMessage withoutProfile = await tester.PostAsJsonAsync($"/api/tests/{prototype}/signups", signup);
        HttpResponseMessage profile = await tester.PutAsJsonAsync("/api/me/tester-profile", new SaveTesterProfileRequest(67, teryts[0], "Słabo widzę", "Smartfon"));
        HttpResponseMessage signedUp = await tester.PostAsJsonAsync($"/api/tests/{prototype}/signups", signup);
        HttpResponseMessage signedUpAgain = await tester.PostAsJsonAsync($"/api/tests/{prototype}/signups", signup);
        List<TestOpportunityResponse>? tests = await tester.GetFromJsonAsync<List<TestOpportunityResponse>>("/api/tests");

        Assert.Equal(HttpStatusCode.BadRequest, withoutProfile.StatusCode);
        Assert.Equal(HttpStatusCode.OK, profile.StatusCode);
        Assert.Equal(HttpStatusCode.Created, signedUp.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, signedUpAgain.StatusCode);
        Assert.True(Assert.Single(tests!).SignedUp);
    }
}
