using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Shared;

/// <summary>Records a job in the database and hands it to the runner.</summary>
public sealed class BackgroundJobScheduler(
    CastorDbContext db,
    BackgroundJobQueue queue,
    IClock clock,
    ILogger<BackgroundJobScheduler> logger)
{
    public const string InterruptedError = "Interrupted by a restart of the application.";

    /// <summary>A job of the same kind that is still waiting or running is not queued a second time.</summary>
    public async Task QueueAsync(BackgroundJobKind kind, CancellationToken cancellationToken)
    {
        bool alreadyPending = await db.BackgroundJobs.AnyAsync(
            job => job.Kind == kind && (job.Status == BackgroundJobStatus.QUEUED || job.Status == BackgroundJobStatus.RUNNING),
            cancellationToken);

        if (alreadyPending)
        {
            logger.LogInformation("A {JobKind} job is already pending; no new one is queued.", kind);
            return;
        }

        var job = BackgroundJob.Queue(kind, clock.UtcNow);
        db.BackgroundJobs.Add(job);
        await db.SaveChangesAsync(cancellationToken);

        queue.Enqueue(job.Id);
        logger.LogInformation("Queued {JobKind} job {JobId}.", kind, job.Id);
    }

    /// <summary>
    /// At start-up nothing runs yet, so a job still waiting or running was cut off by the last shutdown. It is marked
    /// failed; every job is idempotent and can simply be queued again.
    /// </summary>
    public async Task FailInterruptedAsync(CancellationToken cancellationToken)
    {
        List<BackgroundJob> interrupted = await db.BackgroundJobs
            .Where(job => job.Status == BackgroundJobStatus.QUEUED || job.Status == BackgroundJobStatus.RUNNING)
            .ToListAsync(cancellationToken);

        DateTimeOffset now = clock.UtcNow;
        foreach (BackgroundJob job in interrupted)
        {
            job.Fail(InterruptedError, now);
        }

        await db.SaveChangesAsync(cancellationToken);

        if (interrupted.Count > 0)
        {
            logger.LogWarning("Marked {JobCount} interrupted background jobs as failed.", interrupted.Count);
        }
    }
}
