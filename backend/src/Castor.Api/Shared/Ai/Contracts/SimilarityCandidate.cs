namespace Castor.Api.Shared;

/// <summary>An innovation or a submitted idea the duplicate check may name; the id is checked against the candidates.</summary>
/// <param name="Kind">INNOVATION or IDEA.</param>
public sealed record SimilarityCandidate(
    Guid Id,
    string Kind,
    string Title,
    string Summary,
    IReadOnlyList<string> ChallengeAreaCodes);
