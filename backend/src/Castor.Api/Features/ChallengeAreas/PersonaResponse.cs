namespace Castor.Api.Features.ChallengeAreas;

/// <summary>A fictional person from the Social Challenges Map, shown on the area's page.</summary>
public sealed record PersonaResponse(
    string Name,
    int? Age,
    IReadOnlyList<string> Description,
    IReadOnlyList<string> Goals,
    IReadOnlyList<string> Challenges,
    IReadOnlyList<string> Motivations);
