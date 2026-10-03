namespace Castor.Api.Queries;

/// <summary>One indicator of a gmina's portrait: its newest value and the region's mean in the same year.</summary>
/// <param name="Level">GMINA, or POWIAT when the Obserwator has the indicator only per powiat.</param>
public sealed record PortraitIndicator(
    Guid IndicatorId,
    string Name,
    string Group,
    string? Unit,
    IReadOnlyList<string> ChallengeAreaCodes,
    bool General,
    StatisticsLevel Level,
    decimal Value,
    decimal RegionAverage,
    int Year);
