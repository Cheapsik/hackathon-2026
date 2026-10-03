using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Indicators;

/// <summary>
/// The newest year of one indicator, one row per gmina. A powiat-only indicator is repeated for every gmina of that
/// powiat, so the map can colour gminy and the table can say the figure is the powiat's.
/// </summary>
public sealed class GetIndicatorValuesHandler(CastorDbContext db)
{
    public async Task<IndicatorValuesResponse> HandleAsync(Guid indicatorId, CancellationToken cancellationToken)
    {
        Indicator indicator = await db.Indicators.AsNoTracking().SingleOrDefaultAsync(candidate => candidate.Id == indicatorId, cancellationToken)
            ?? throw new DomainException("The indicator does not exist.", StatusCodes.Status404NotFound);

        List<IndicatorValue> values = await db.IndicatorValues
            .AsNoTracking()
            .Where(value => value.IndicatorId == indicator.Id)
            .ToListAsync(cancellationToken);

        List<IndicatorValue> gminaValues = NewestYear(values, StatisticsLevel.GMINA);
        bool perGmina = gminaValues.Count > 0;
        List<IndicatorValue> chosen = perGmina ? gminaValues : NewestYear(values, StatisticsLevel.POWIAT);
        if (chosen.Count == 0)
        {
            throw new DomainException("The indicator has no values.", StatusCodes.Status404NotFound);
        }

        int year = chosen[0].Year;
        decimal average = decimal.Round(chosen.Average(value => value.Value.Value), Measure.Scale, MidpointRounding.AwayFromZero);
        List<Municipality> municipalities = await db.Municipalities.AsNoTracking().ToListAsync(cancellationToken);

        List<IndicatorTerritoryValueResponse> rows = perGmina
            ? GminaRows(chosen, municipalities)
            : PowiatRows(chosen, municipalities);

        string level = (perGmina ? StatisticsLevel.GMINA : StatisticsLevel.POWIAT).ToString();
        return new IndicatorValuesResponse(indicator.Id, indicator.Name, indicator.Unit, year, level, average, rows);
    }

    private static List<IndicatorValue> NewestYear(List<IndicatorValue> values, StatisticsLevel level)
    {
        List<IndicatorValue> ofLevel = [.. values.Where(value => value.Level == level)];
        if (ofLevel.Count == 0)
        {
            return [];
        }

        int year = ofLevel.Max(value => value.Year);
        return [.. ofLevel.Where(value => value.Year == year)];
    }

    private static List<IndicatorTerritoryValueResponse> GminaRows(List<IndicatorValue> values, List<Municipality> municipalities)
    {
        Dictionary<string, Municipality> byTeryt = municipalities.ToDictionary(municipality => municipality.Teryt);

        return [.. values
            .Where(value => byTeryt.ContainsKey(value.TerritoryCode))
            .OrderBy(value => byTeryt[value.TerritoryCode].Name)
            .Select(value => new IndicatorTerritoryValueResponse(value.TerritoryCode, byTeryt[value.TerritoryCode].QualifiedName, value.Value.Value))];
    }

    private static List<IndicatorTerritoryValueResponse> PowiatRows(List<IndicatorValue> values, List<Municipality> municipalities)
    {
        Dictionary<string, decimal> byPowiat = values.ToDictionary(value => value.TerritoryCode, value => value.Value.Value);

        return [.. municipalities
            .Where(municipality => byPowiat.ContainsKey(municipality.Teryt[..4]))
            .OrderBy(municipality => municipality.Name)
            .Select(municipality => new IndicatorTerritoryValueResponse(municipality.Teryt, municipality.QualifiedName, byPowiat[municipality.Teryt[..4]]))];
    }
}
