namespace Castor.Api.Features.Indicators;

/// <summary>Every gmina's value of one indicator in its newest year, for the choropleth and the table beside it.</summary>
/// <param name="Level">GMINA, or POWIAT when each gmina shows its powiat's figure.</param>
public sealed record IndicatorValuesResponse(
    Guid IndicatorId,
    string Name,
    string? Unit,
    int Year,
    string Level,
    decimal RegionAverage,
    IReadOnlyList<IndicatorTerritoryValueResponse> Values);
