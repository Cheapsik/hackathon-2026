namespace Castor.Api.Shared;

/// <summary>An idea card, anonymized, and the innovations and ideas it may duplicate.</summary>
public sealed record SimilarityInput(
    string Idea,
    IReadOnlyList<string> ChallengeAreaCodes,
    IReadOnlyList<SimilarityCandidate> Candidates);
