using System.Net;
using System.Net.Http.Json;
using Castor.Api.Features.BackgroundJobs;
using Castor.Api.Shared;

namespace Castor.Tests;

[Collection(PostgresCollection.Name)]
public sealed class GenomeJobApiTests(PostgresFixture postgres)
{
    private static readonly TimeSpan JobTimeout = TimeSpan.FromSeconds(30);

    /// <summary>
    /// PostgreSQL refuses text with a NUL character, so the genome of "Alfa" fails at saving — after the model
    /// answered. Only that innovation fails; the job goes on, finishes, and the API keeps running.
    /// </summary>
    [Fact]
    public async Task A_genome_the_database_refuses_fails_only_its_own_innovation()
    {
        var llm = new ScriptedLlmClient
        {
            Reshape = (prompt, answer) => answer is GenomeResult genome && prompt.Input.Contains("Alfa", StringComparison.Ordinal)
                ? genome with { Summary = "Streszczenie\u0000z bajtem zerowym" }
                : answer,
        };
        ApiFactory factory = await TestApi.FactoryAsync(postgres, llm);
        await KnowledgeData.AddInnovationsWithoutGenomeAsync(factory, "Alfa", "Beta");
        HttpClient admin = await TestApi.AdminAsync(factory);

        HttpResponseMessage queued = await admin.PostAsync("/api/admin/jobs/genomes", null);
        BackgroundJobResponse job = await WaitForFinishedJobAsync(admin);
        HttpResponseMessage stillServing = await admin.GetAsync("/api/admin/jobs");

        Assert.Equal(HttpStatusCode.Accepted, queued.StatusCode);
        Assert.Equal("SUCCEEDED", job.Status);
        Assert.Equal(1, job.Done);
        Assert.Equal(1, job.Failed);
        Assert.Equal(HttpStatusCode.OK, stillServing.StatusCode);
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
