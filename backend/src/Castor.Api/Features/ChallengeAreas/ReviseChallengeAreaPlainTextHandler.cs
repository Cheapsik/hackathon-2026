using Castor.Api.Features.PlainText;

namespace Castor.Api.Features.ChallengeAreas;

public sealed class ReviseChallengeAreaPlainTextHandler(CastorDbContext db)
{
    public async Task<PlainTextResponse> HandleAsync(string code, RevisePlainTextRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        ChallengeArea area = await GetChallengeAreaPlainTextHandler.FindAsync(db, code, cancellationToken);
        area.RecordPlainText(request.Text);
        await db.SaveChangesAsync(cancellationToken);

        return GetChallengeAreaPlainTextHandler.ToResponse(area);
    }
}
