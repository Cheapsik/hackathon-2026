namespace Castor.Api.Features.ProblemReports;

/// <summary>A row of the administrators' inbox.</summary>
/// <param name="JoinedCount">How many people joined this case with "To moja sprawa".</param>
public sealed record InboxProblemReportSummaryResponse(
    Guid Id,
    string TrackingCode,
    string Status,
    string? Urgency,
    string Channel,
    string? MainChallengeArea,
    string? Municipality,
    string DescriptionPreview,
    bool AwaitsAnswers,
    bool IsMatched,
    int? BestScore,
    bool HasReplyDraft,
    int JoinedCount,
    DateTimeOffset CreatedAt);
