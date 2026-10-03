namespace Castor.Api.Shared;

/// <summary>What the language model returns for the duplicate check.</summary>
public sealed record SimilarityResult(
    IReadOnlyList<SimilarityMatch>? Similar);
