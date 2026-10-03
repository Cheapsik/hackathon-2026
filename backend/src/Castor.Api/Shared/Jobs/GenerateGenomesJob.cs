using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Shared;

/// <summary>
/// Draft genomes for every innovation that has none. Idempotent: an innovation with a genome is skipped, so a job cut
/// off half-way only does the rest when it runs again. One failed innovation does not stop the others.
/// </summary>
public sealed class GenerateGenomesJob(
    CastorDbContext db,
    GenomeGenerator generator,
    IClock clock,
    ILogger<GenerateGenomesJob> logger)
{
    public async Task RunAsync(BackgroundJob job, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(job);

        List<ChallengeArea> challengeAreas = await db.ChallengeAreas.AsNoTracking().OrderBy(area => area.Number).ToListAsync(cancellationToken);
        List<Innovation> withoutGenome = await db.Innovations
            .Where(innovation => innovation.Genome == null)
            .OrderBy(innovation => innovation.Title)
            .ToListAsync(cancellationToken);

        job.Start(withoutGenome.Count, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        foreach (Innovation innovation in withoutGenome)
        {
            bool generated = await GenerateOneAsync(innovation, challengeAreas, cancellationToken);
            job.RecordItem(generated);
            await db.SaveChangesAsync(cancellationToken);
        }

        DateTimeOffset finishedAt = clock.UtcNow;
        if (withoutGenome.Count > 0 && job.Done == 0)
        {
            job.Fail("No genome could be generated.", finishedAt);
        }
        else
        {
            job.Succeed(finishedAt);
        }

        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Genome job {JobId}: {Done} generated, {Failed} failed.", job.Id, job.Done, job.Failed);
    }

    private async Task<bool> GenerateOneAsync(
        Innovation innovation,
        IReadOnlyList<ChallengeArea> challengeAreas,
        CancellationToken cancellationToken)
    {
        try
        {
            InnovationGenome genome = await generator.GenerateAsync(innovation, challengeAreas, clock.UtcNow, cancellationToken);
            db.InnovationGenomes.Add(genome);
            return true;
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogError(exception, "Genome for innovation {InnovationId} could not be generated.", innovation.Id);
            return false;
        }
    }
}
