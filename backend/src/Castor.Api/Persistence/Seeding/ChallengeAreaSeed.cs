namespace Castor.Api.Persistence;

/// <summary>One entry of data/seed/challenge_areas.json.</summary>
public sealed record ChallengeAreaSeed(
    string Code,
    int Number,
    string Name,
    string Definition,
    List<string> KeyChallenges,
    string Source);
