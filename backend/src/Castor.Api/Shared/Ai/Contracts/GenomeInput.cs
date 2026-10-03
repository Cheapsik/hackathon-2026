namespace Castor.Api.Shared;

/// <summary>Input of the genome prompt: the innovation card and the challenge areas to choose from.</summary>
public sealed record GenomeInput(
    string Title,
    IReadOnlyList<string> Categories,
    string? Solution,
    string? Problems,
    string? TargetGroup,
    string? Beneficiaries,
    string? Evidence,
    IReadOnlyList<ChallengeAreaBrief> ChallengeAreas);
