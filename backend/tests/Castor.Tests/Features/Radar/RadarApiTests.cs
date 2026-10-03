using System.Net.Http.Json;
using Castor.Api.Features.ProblemReports;
using Castor.Api.Features.Radar;

namespace Castor.Tests;

/// <summary>"Radar potrzeb": needs counted per gmina, one row per gmina however many reports it sent.</summary>
[Collection(PostgresCollection.Name)]
public sealed class RadarApiTests(PostgresFixture postgres)
{
    private const string Description =
        "Samotni seniorzy mieszkający w naszej wsi od wielu miesięcy nie mają świetlicy ani regularnych spotkań sąsiedzkich. "
        + "Brakuje transportu do miasta, wolontariuszy, opiekunek oraz zajęć ruchowych przez cały tydzień, a rodziny pracują daleko.";

    [Fact]
    public async Task Reports_from_one_gmina_are_summed_in_one_row()
    {
        ApiFactory factory = await TestApi.FactoryAsync(postgres, new ScriptedLlmClient());
        IReadOnlyList<string> teryts = await KnowledgeData.AddMunicipalitiesAsync(factory, "Bobowa", "Gorlice");
        await SendReportAsync(factory, teryts[0]);
        await SendReportAsync(factory, teryts[0]);
        await SendReportAsync(factory, teryts[1]);
        HttpClient admin = await TestApi.AdminAsync(factory);

        RadarResponse? radar = await admin.GetFromJsonAsync<RadarResponse>("/api/admin/radar");

        Assert.Collection(
            radar!.ByMunicipality,
            first =>
            {
                Assert.Equal(teryts[0], first.Teryt);
                Assert.Equal(2, first.Reports);
            },
            second =>
            {
                Assert.Equal(teryts[1], second.Teryt);
                Assert.Equal(1, second.Reports);
            });
    }

    private static async Task SendReportAsync(ApiFactory factory, string teryt)
    {
        HttpClient visitor = factory.CreateClient(TestApi.Cookies);
        var request = new CreateProblemReportRequest(Description, teryt, SubmittedOnBehalf: false, Dictated: false, KeepOriginalDescription: false);
        HttpResponseMessage created = await visitor.PostAsJsonAsync("/api/problem-reports", request);
        created.EnsureSuccessStatusCode();
    }
}
