using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.InnovationGenomes;

public sealed class GetInnovationGenomeHandler(CastorDbContext db)
{
    public async Task<InnovationGenomeResponse> HandleAsync(Guid genomeId, CancellationToken cancellationToken)
    {
        InnovationGenome genome = await db.InnovationGenomes.AsNoTracking().SingleOrDefaultAsync(candidate => candidate.Id == genomeId, cancellationToken)
            ?? throw new DomainException("The genome does not exist.", StatusCodes.Status404NotFound);
        string title = await db.Innovations.Where(innovation => innovation.Id == genome.InnovationId).Select(innovation => innovation.Title).SingleAsync(cancellationToken);

        return genome.ToResponse(title);
    }
}
