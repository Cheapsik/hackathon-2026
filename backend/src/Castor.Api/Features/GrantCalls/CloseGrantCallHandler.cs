using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.GrantCalls;

public sealed class CloseGrantCallHandler(CastorDbContext db, IClock clock)
{
    public async Task<GrantCallResponse> HandleAsync(Guid grantCallId, CancellationToken cancellationToken)
    {
        GrantCall grantCall = await db.GrantCalls.SingleOrDefaultAsync(candidate => candidate.Id == grantCallId, cancellationToken)
            ?? throw new DomainException("The grant call does not exist.", StatusCodes.Status404NotFound);

        grantCall.Close(clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        return grantCall.ToResponse();
    }
}
