namespace Castor.Api.Shared;

/// <summary>Input of the classification prompt.</summary>
public sealed record ProblemClassificationInput(
    string Description,
    IReadOnlyList<ChallengeAreaBrief> ChallengeAreas);
