namespace Castor.Api.Queries;

/// <summary>A row of the region-average SQL in <see cref="MunicipalityPortraitQuery"/>.</summary>
public sealed record RegionAverageRow(Guid IndicatorId, string Level, int Year, decimal Average);
