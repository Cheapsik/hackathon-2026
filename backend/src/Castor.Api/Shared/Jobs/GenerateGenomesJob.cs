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
        // Not tracked: a tracked innovation would point at a refused genome and bring it back into the next save.
        List<Innovation> withoutGenome = await db.Innovations
            .AsNoTracking()
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

    /// <summary>
    /// Generates and saves one genome. A genome the database refuses is detached again, so it does not fail the save
    /// of every innovation after it.
    /// </summary>
    private async Task<bool> GenerateOneAsync(
        Innovation innovation,
        IReadOnlyList<ChallengeArea> challengeAreas,
        CancellationToken cancellationToken)
    {
        InnovationGenome? genome = null;
        try
        {
            genome = await generator.GenerateAsync(innovation, challengeAreas, clock.UtcNow, cancellationToken);
            db.InnovationGenomes.Add(genome);
            await db.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception exception) when (!cancellationToken.IsCancellationRequested)
        {
            if (genome is not null)
            {
                db.Entry(genome).State = EntityState.Detached;
            }

            logger.LogError(exception, "Genome for innovation {InnovationId} could not be generated.", innovation.Id);
            return false;
        }
    }
}
