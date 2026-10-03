using Castor.Api.Features.PlainText;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Innovations;

public sealed class ReviseInnovationPlainTextHandler(CastorDbContext db, IClock clock)
{
    public async Task<PlainTextResponse> HandleAsync(Guid innovationId, RevisePlainTextRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Innovation innovation = await db.Innovations.SingleOrDefaultAsync(candidate => candidate.Id == innovationId, cancellationToken)
            ?? throw new DomainException("The innovation does not exist.", StatusCodes.Status404NotFound);

        innovation.RecordPlainText(request.Text, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        return GetInnovationPlainTextHandler.ToResponse(innovation);
    }
}
