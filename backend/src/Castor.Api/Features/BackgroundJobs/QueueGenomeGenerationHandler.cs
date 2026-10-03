namespace Castor.Api.Features.BackgroundJobs;

/// <summary>Generates the genomes still missing — e.g. after a failed run.</summary>
public sealed class QueueGenomeGenerationHandler(BackgroundJobScheduler jobs)
{
    public Task HandleAsync(CancellationToken cancellationToken)
    {
        return jobs.QueueAsync(BackgroundJobKind.GENERATE_GENOMES, cancellationToken);
    }
}
