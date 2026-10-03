using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ChallengeAreas;

/// <summary>The eight areas in the map's order. Their pages (persona, data, innovations) come with module II.</summary>
public sealed class ListChallengeAreasHandler(CastorDbContext db)
{
    public async Task<IReadOnlyList<ChallengeAreaResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        List<ChallengeArea> areas = await db.ChallengeAreas.AsNoTracking().OrderBy(area => area.Number).ToListAsync(cancellationToken);

        return [.. areas.Select(area => new ChallengeAreaResponse(area.Code, area.Number, area.Name, area.Definition, area.KeyChallenges, area.Source))];
    }
}
