namespace Castor.Api.Shared;

/// <summary>One figure of the gmina's portrait; the model reads it and never computes statistics itself (SPEC 6.2).</summary>
public sealed record FitIndicatorBrief(
    Guid IndicatorId,
    string Name,
    string? Unit,
    IReadOnlyList<string> ChallengeAreaCodes,
    bool General,
    string Level,
    decimal Value,
    decimal RegionAverage,
    int Year);
