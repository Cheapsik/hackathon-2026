using Castor.Api.Features.PlainText;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Innovations;

public sealed class ApproveInnovationPlainTextHandler(CastorDbContext db, IClock clock)
{
    public async Task<PlainTextResponse> HandleAsync(Guid innovationId, CancellationToken cancellationToken)
    {
        Innovation innovation = await db.Innovations.SingleOrDefaultAsync(candidate => candidate.Id == innovationId, cancellationToken)
            ?? throw new DomainException("The innovation does not exist.", StatusCodes.Status404NotFound);

        innovation.ApprovePlainText(clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        return GetInnovationPlainTextHandler.ToResponse(innovation);
    }
}
