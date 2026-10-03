using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.BackgroundJobs;

/// <summary>The newest jobs with their progress, for the administrator's panel.</summary>
public sealed class ListBackgroundJobsHandler(CastorDbContext db)
{
    private const int Limit = 20;

    public async Task<IReadOnlyList<BackgroundJobResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        List<BackgroundJob> jobs = await db.BackgroundJobs.AsNoTracking().OrderByDescending(job => job.CreatedAt).Take(Limit).ToListAsync(cancellationToken);

        return [.. jobs.Select(job => new BackgroundJobResponse(
            job.Id,
            job.Kind.ToString(),
            job.Status.ToString(),
            job.Total,
            job.Done,
            job.Failed,
            job.Error,
            job.CreatedAt,
            job.StartedAt,
            job.FinishedAt))];
    }
}
