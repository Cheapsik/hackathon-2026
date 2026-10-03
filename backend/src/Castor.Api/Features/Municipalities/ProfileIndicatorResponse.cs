namespace Castor.Api.Features.Municipalities;

/// <param name="Level">GMINA, or POWIAT when the Obserwator publishes the indicator only per powiat.</param>
public sealed record ProfileIndicatorResponse(
    Guid IndicatorId,
    string Name,
    string? Unit,
    string Level,
    decimal Value,
    decimal RegionAverage,
    int Year,
    bool General);
