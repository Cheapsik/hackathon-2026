namespace Castor.Api.Features.Conversations;

/// <param name="Kind">PROBLEM_REPORT, EXPERT_QUESTION or PARTNERSHIP.</param>
/// <param name="ProblemReportTrackingCode">Shown as XXXX-XXXX; only for a report's thread.</param>
public sealed record ConversationSummaryResponse(
    Guid Id,
    string Kind,
    string? Subject,
    string? ChallengeAreaName,
    string? InnovationTitle,
    string? ProblemReportTrackingCode,
    string? ProblemReportStatus,
    DateTimeOffset? LastMessageAt,
    DateTimeOffset CreatedAt);
