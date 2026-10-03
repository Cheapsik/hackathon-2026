using Castor.Api.Features.Feedback;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Innovations;

public sealed class SetInnovationSeeksTestersHandler(CastorDbContext db, CurrentUser currentUser, IClock clock)
{
    public async Task<InnovationResponse> HandleAsync(Guid innovationId, SetSeeksTestersRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Innovation innovation = await db.Innovations
                .Include(candidate => candidate.Genome)
                .SingleOrDefaultAsync(candidate => candidate.Id == innovationId, cancellationToken)
            ?? throw new DomainException("The innovation does not exist.", StatusCodes.Status404NotFound);

        if (!await InnovationTeamAccess.CanManageAsync(db, innovation, currentUser.UserId, currentUser.IsAdmin, cancellationToken))
        {
            throw new DomainException("Only the innovation's team or ROPS turns tester seeking on.", StatusCodes.Status403Forbidden);
        }

        innovation.SetSeeksTesters(request.SeeksTesters, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);
        return innovation.ToResponse(canToggleSeeksTesters: true);
    }
}
