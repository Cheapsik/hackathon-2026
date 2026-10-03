using Castor.Api.Features.PlainText;

namespace Castor.Api.Features.ChallengeAreas;

public sealed class ApproveChallengeAreaPlainTextHandler(CastorDbContext db)
{
    public async Task<PlainTextResponse> HandleAsync(string code, CancellationToken cancellationToken)
    {
        ChallengeArea area = await GetChallengeAreaPlainTextHandler.FindAsync(db, code, cancellationToken);
        area.ApprovePlainText();
        await db.SaveChangesAsync(cancellationToken);

        return GetChallengeAreaPlainTextHandler.ToResponse(area);
    }
}
