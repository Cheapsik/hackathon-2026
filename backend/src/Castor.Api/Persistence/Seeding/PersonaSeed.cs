namespace Castor.Api.Persistence;

/// <summary>One entry of data/seed/personas.json.</summary>
public sealed record PersonaSeed(
    string Name,
    int? Age,
    List<string> Description,
    List<string> Goals,
    List<string> Challenges,
    List<string> Motivations,
    string ChallengeArea);
