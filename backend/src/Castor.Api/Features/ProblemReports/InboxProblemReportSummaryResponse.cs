namespace Castor.Api.Features.ProblemReports;

/// <summary>A row of the administrators' inbox.</summary>
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
    DateTimeOffset CreatedAt);
