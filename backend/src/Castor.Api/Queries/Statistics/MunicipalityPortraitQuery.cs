using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Queries;

/// <summary>
/// The portrait of a gmina for given challenge areas: every general indicator and every indicator of those areas, with
/// the gmina's newest value — or its powiat's, when the Obserwator has the indicator only per powiat — and the mean of
/// the region in the same year. The figures come from SQL; the language model only reads them (SPEC 6.2).
/// </summary>
public sealed class MunicipalityPortraitQuery(CastorDbContext db)
{
    public async Task<MunicipalityPortrait> ForAsync(
        Municipality municipality,
        IReadOnlyList<string> challengeAreaCodes,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(municipality);
        ArgumentNullException.ThrowIfNull(challengeAreaCodes);

        List<Indicator> indicators = await db.Indicators
            .AsNoTracking()
            .Where(indicator => indicator.General || indicator.ChallengeAreaCodes.Any(code => challengeAreaCodes.Contains(code)))
            .OrderBy(indicator => indicator.Group)
            .ThenBy(indicator => indicator.Name)
            .ToListAsync(cancellationToken);
        List<Guid> indicatorIds = [.. indicators.Select(indicator => indicator.Id)];

        string teryt = municipality.Teryt;
        string powiatCode = teryt[..4];
        List<IndicatorValue> values = await db.IndicatorValues
            .AsNoTracking()
            .Where(value => indicatorIds.Contains(value.IndicatorId)
                && ((value.Level == StatisticsLevel.GMINA && value.TerritoryCode == teryt)
                    || (value.Level == StatisticsLevel.POWIAT && value.TerritoryCode == powiatCode)))
            .ToListAsync(cancellationToken);

        List<RegionAverageRow> averages = await db.Database
            .SqlQuery<RegionAverageRow>(
                $"""
                SELECT "IndicatorId", "Level", "Year", avg("Value") AS "Average"
                FROM "IndicatorValues"
                WHERE "IndicatorId" = ANY({indicatorIds.ToArray()})
                GROUP BY "IndicatorId", "Level", "Year"
                """)
            .ToListAsync(cancellationToken);

        var portrait = new List<PortraitIndicator>();
        foreach (Indicator indicator in indicators)
        {
            IndicatorValue? chosen = Newest(values, indicator.Id, StatisticsLevel.GMINA)
                ?? Newest(values, indicator.Id, StatisticsLevel.POWIAT);
            if (chosen is null)
            {
                continue;
            }

            string level = chosen.Level.ToString();
            RegionAverageRow? average = averages.FirstOrDefault(row =>
                row.IndicatorId == indicator.Id && row.Level == level && row.Year == chosen.Year);
            if (average is null)
            {
                continue;
            }

            portrait.Add(new PortraitIndicator(
                indicator.Id,
                indicator.Name,
                indicator.Group,
                indicator.Unit,
                indicator.ChallengeAreaCodes,
                indicator.General,
                chosen.Level,
                chosen.Value.Value,
                decimal.Round(average.Average, Measure.Scale, MidpointRounding.AwayFromZero),
                chosen.Year));
        }

        return new MunicipalityPortrait(municipality, portrait);
    }

    private static IndicatorValue? Newest(List<IndicatorValue> values, Guid indicatorId, StatisticsLevel level)
    {
        return values
            .Where(value => value.IndicatorId == indicatorId && value.Level == level)
            .OrderByDescending(value => value.Year)
            .FirstOrDefault();
    }
}
