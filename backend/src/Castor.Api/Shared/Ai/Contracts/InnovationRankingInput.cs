namespace Castor.Api.Shared;

/// <summary>Input of the ranking prompt.</summary>
public sealed record InnovationRankingInput(
    string Problem,
    IReadOnlyList<string> ChallengeAreaCodes,
    IReadOnlyList<CandidateInnovation> Candidates);
