using Castor.Api.Features.PlainText;

namespace Castor.Api.Features.ChallengeAreas;

public sealed class GenerateChallengeAreaPlainTextHandler(CastorDbContext db, PlainTextWriter writer)
{
    public async Task<PlainTextResponse> HandleAsync(string code, CancellationToken cancellationToken)
    {
        ChallengeArea area = await GetChallengeAreaPlainTextHandler.FindAsync(db, code, cancellationToken);
        string rewritten = await writer.RewriteAsync(area.Name, area.Definition, cancellationToken);
        area.RecordPlainText(rewritten);
        await db.SaveChangesAsync(cancellationToken);

        return GetChallengeAreaPlainTextHandler.ToResponse(area);
    }
}
