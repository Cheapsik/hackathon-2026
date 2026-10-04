namespace Castor.Api.Queries;

/// <summary>Everything shown with a problem report besides the report itself.</summary>
/// <param name="Matches">Ordered by position; a match has its innovation loaded.</param>
/// <param name="HybridSources">The innovations hybrids are made of, by id.</param>
/// <param name="ChallengeAreas">The challenge areas of the report, in its order.</param>
/// <param name="ConversationId">The report's thread.</param>
/// <param name="JoinedCount">How many other reports joined this one's case.</param>
/// <param name="JoinedCase">The case this report joined; null while it is a case of its own.</param>
public sealed record ProblemReportView(
    IReadOnlyList<MatchResult> Matches,
    IReadOnlyDictionary<Guid, Innovation> HybridSources,
    IReadOnlyList<ChallengeArea> ChallengeAreas,
    SimilarProblemReports Similar,
    Guid ConversationId,
    int JoinedCount,
    JoinedCase? JoinedCase);
