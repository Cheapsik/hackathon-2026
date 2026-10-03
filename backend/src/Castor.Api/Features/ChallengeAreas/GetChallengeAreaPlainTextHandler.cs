using Castor.Api.Features.PlainText;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ChallengeAreas;

public sealed class GetChallengeAreaPlainTextHandler(CastorDbContext db)
{
    public async Task<PlainTextResponse> HandleAsync(string code, CancellationToken cancellationToken)
    {
        ChallengeArea area = await FindAsync(db, code, cancellationToken);
        return ToResponse(area);
    }

    internal static async Task<ChallengeArea> FindAsync(CastorDbContext db, string code, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(code);

        return await db.ChallengeAreas.SingleOrDefaultAsync(candidate => candidate.Code == code.Trim(), cancellationToken)
            ?? throw new DomainException("The challenge area does not exist.", StatusCodes.Status404NotFound);
    }

    internal static PlainTextResponse ToResponse(ChallengeArea area)
    {
        if (area.PlainText is null || area.PlainTextStatus is null)
        {
            throw new DomainException("This challenge area has no plain-language text.", StatusCodes.Status404NotFound);
        }

        return new PlainTextResponse(area.PlainText, area.PlainTextStatus.ToString()!);
    }
}
