using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Innovations;

public sealed class GetInnovationHandler(CastorDbContext db)
{
    public async Task<InnovationResponse> HandleAsync(Guid innovationId, CancellationToken cancellationToken)
    {
        Innovation innovation = await db.Innovations
                .AsNoTracking()
                .Include(candidate => candidate.Genome)
                .SingleOrDefaultAsync(candidate => candidate.Id == innovationId, cancellationToken)
            ?? throw new DomainException("The innovation does not exist.", StatusCodes.Status404NotFound);

        return innovation.ToResponse();
    }
}
