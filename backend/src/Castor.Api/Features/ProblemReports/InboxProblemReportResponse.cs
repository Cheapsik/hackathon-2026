namespace Castor.Api.Features.ProblemReports;

/// <summary>A report as an administrator works on it: the report with its matches, plus urgency, experts and the reply draft.</summary>
public sealed record InboxProblemReportResponse(
    ProblemReportResponse Report,
    string? Urgency,
    IReadOnlyList<SuggestedExpertResponse> SuggestedExperts,
    string? ReplyDraft,
    DateTimeOffset? ReplyDraftUpdatedAt);
