using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.InnovationGenomes;

/// <summary>
/// "Ponowne przeliczenie genomu": the genome is removed and the background job generates a new draft. Nothing points at a
/// genome (matches and cards point at the innovation), so removing it is safe.
/// </summary>
public sealed class RecalculateInnovationGenomeHandler(CastorDbContext db, BackgroundJobScheduler jobs)
{
    public async Task HandleAsync(Guid genomeId, CancellationToken cancellationToken)
    {
        InnovationGenome genome = await db.InnovationGenomes.SingleOrDefaultAsync(candidate => candidate.Id == genomeId, cancellationToken)
            ?? throw new DomainException("The genome does not exist.", StatusCodes.Status404NotFound);

        db.InnovationGenomes.Remove(genome);
        await db.SaveChangesAsync(cancellationToken);

        await jobs.QueueAsync(BackgroundJobKind.GENERATE_GENOMES, cancellationToken);
    }
}
