namespace Castor.Api.Persistence;

/// <summary>One entry of data/seed/indicators.json; <see cref="Id"/> is the Obserwator id.</summary>
public sealed record IndicatorSeed(
    int Id,
    string Name,
    string Group,
    string? Description,
    string? Source,
    string? Unit,
    List<string> ChallengeAreas,
    bool General);
