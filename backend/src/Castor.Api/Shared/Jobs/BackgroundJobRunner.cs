using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Shared;

/// <summary>Runs queued jobs one after another, in the process — no external queue (SPEC 9).</summary>
public sealed class BackgroundJobRunner(
    BackgroundJobQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<BackgroundJobRunner> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (Guid jobId in queue.ReadAllAsync(stoppingToken))
        {
            await RunAsync(jobId, stoppingToken);
        }
    }

    private async Task RunAsync(Guid jobId, CancellationToken stoppingToken)
    {
        await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
        CastorDbContext db = scope.ServiceProvider.GetRequiredService<CastorDbContext>();
        IClock clock = scope.ServiceProvider.GetRequiredService<IClock>();

        BackgroundJob? job = await db.BackgroundJobs.SingleOrDefaultAsync(candidate => candidate.Id == jobId, stoppingToken);
        if (job is null || job.Status != BackgroundJobStatus.QUEUED)
        {
            logger.LogWarning("Job {JobId} is not waiting to run and was skipped.", jobId);
            return;
        }

        try
        {
            switch (job.Kind)
            {
                case BackgroundJobKind.GENERATE_GENOMES:
                    GenerateGenomesJob generateGenomes = scope.ServiceProvider.GetRequiredService<GenerateGenomesJob>();
                    await generateGenomes.RunAsync(job, stoppingToken);
                    break;
                default:
                    throw new InvalidOperationException($"No runner for job kind {job.Kind}.");
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // The application stops; the start-up marks the job failed next time.
            throw;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "{JobKind} job {JobId} failed.", job.Kind, job.Id);
            job.Fail(exception.Message, clock.UtcNow);
            await db.SaveChangesAsync(CancellationToken.None);
        }
    }
}
