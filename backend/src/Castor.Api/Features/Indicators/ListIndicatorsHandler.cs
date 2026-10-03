using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Indicators;

public sealed class ListIndicatorsHandler(CastorDbContext db)
{
    public async Task<IReadOnlyList<IndicatorSummaryResponse>> HandleAsync(ListIndicatorsRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        IQueryable<Indicator> query = db.Indicators.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(request.ChallengeArea))
        {
            string area = request.ChallengeArea.Trim();
            query = query.Where(indicator => indicator.General || indicator.ChallengeAreaCodes.Contains(area));
        }

        List<Indicator> indicators = await query.OrderBy(indicator => indicator.Group).ThenBy(indicator => indicator.Name).ToListAsync(cancellationToken);

        return [.. indicators.Select(indicator => new IndicatorSummaryResponse(
            indicator.Id,
            indicator.Name,
            indicator.Group,
            indicator.Unit,
            indicator.General,
            indicator.ChallengeAreaCodes))];
    }
}
