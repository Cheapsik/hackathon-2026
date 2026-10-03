using Castor.Api.Features.Feedback;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Innovations;

public sealed class GetInnovationHandler(CastorDbContext db, CurrentUser currentUser)
{
    public async Task<InnovationResponse> HandleAsync(Guid innovationId, CancellationToken cancellationToken)
    {
        Innovation innovation = await db.Innovations
                .AsNoTracking()
                .Include(candidate => candidate.Genome)
                .SingleOrDefaultAsync(candidate => candidate.Id == innovationId, cancellationToken)
            ?? throw new DomainException("The innovation does not exist.", StatusCodes.Status404NotFound);

        Guid readerId = currentUser.UserIdOrNull ?? Guid.Empty;
        bool canToggle = await InnovationTeamAccess.CanManageAsync(db, innovation, readerId, currentUser.IsAdmin, cancellationToken);
        return innovation.ToResponse(canToggle);
    }
}
