namespace Castor.Api.Queries;

/// <summary>Everything shown with a problem report besides the report itself.</summary>
/// <param name="Matches">Ordered by position; a match has its innovation loaded.</param>
/// <param name="HybridSources">The innovations hybrids are made of, by id.</param>
/// <param name="ChallengeAreas">The challenge areas of the report, in its order.</param>
public sealed record ProblemReportView(
    IReadOnlyList<MatchResult> Matches,
    IReadOnlyDictionary<Guid, Innovation> HybridSources,
    IReadOnlyList<ChallengeArea> ChallengeAreas,
    SimilarProblemReports Similar);
