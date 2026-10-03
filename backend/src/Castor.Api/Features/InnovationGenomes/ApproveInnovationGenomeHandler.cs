using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.InnovationGenomes;

public sealed class ApproveInnovationGenomeHandler(CastorDbContext db, CurrentUser currentUser, IClock clock)
{
    public async Task<InnovationGenomeResponse> HandleAsync(Guid genomeId, CancellationToken cancellationToken)
    {
        Guid adminId = currentUser.UserId;
        InnovationGenome genome = await db.InnovationGenomes.SingleOrDefaultAsync(candidate => candidate.Id == genomeId, cancellationToken)
            ?? throw new DomainException("The genome does not exist.", StatusCodes.Status404NotFound);

        genome.Approve(adminId, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        string title = await db.Innovations.Where(innovation => innovation.Id == genome.InnovationId).Select(innovation => innovation.Title).SingleAsync(cancellationToken);
        return genome.ToResponse(title);
    }
}
