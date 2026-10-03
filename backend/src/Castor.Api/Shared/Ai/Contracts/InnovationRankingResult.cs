namespace Castor.Api.Shared;

/// <summary>What the language model returns for the ranking.</summary>
public sealed record InnovationRankingResult(
    IReadOnlyList<RankedInnovation>? Matches);
