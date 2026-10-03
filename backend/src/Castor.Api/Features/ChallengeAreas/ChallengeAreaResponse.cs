namespace Castor.Api.Features.ChallengeAreas;

/// <summary>An area of the Social Challenges Map; <see cref="Source"/> says its data are national.</summary>
public sealed record ChallengeAreaResponse(
    string Code,
    int Number,
    string Name,
    string Definition,
    IReadOnlyList<string> KeyChallenges,
    string Source);
