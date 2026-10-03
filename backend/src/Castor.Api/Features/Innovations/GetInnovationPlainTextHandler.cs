using Castor.Api.Features.PlainText;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Innovations;

public sealed class GetInnovationPlainTextHandler(CastorDbContext db)
{
    public async Task<PlainTextResponse> HandleAsync(Guid innovationId, CancellationToken cancellationToken)
    {
        Innovation innovation = await db.Innovations.AsNoTracking().SingleOrDefaultAsync(candidate => candidate.Id == innovationId, cancellationToken)
            ?? throw new DomainException("The innovation does not exist.", StatusCodes.Status404NotFound);

        return ToResponse(innovation);
    }

    internal static PlainTextResponse ToResponse(Innovation innovation)
    {
        if (innovation.PlainText is null || innovation.PlainTextStatus is null)
        {
            throw new DomainException("This innovation has no plain-language text.", StatusCodes.Status404NotFound);
        }

        return new PlainTextResponse(innovation.PlainText, innovation.PlainTextStatus.ToString()!);
    }
}
