namespace Castor.Api.Features.Conversations;

/// <param name="Kind">PROBLEM_REPORT, EXPERT_QUESTION or PARTNERSHIP.</param>
/// <param name="Subject">Null for a report's thread.</param>
/// <param name="ChallengeArea">The area whose experts answer a question.</param>
/// <param name="Innovation">The innovation a partnership is about.</param>
/// <param name="ProblemReport">The report of a report's thread.</param>
/// <param name="SenderRole">The side the reader writes on: INITIATOR, EXPERT or ADMIN.</param>
/// <param name="AcceptsMessages">False once the report is closed; the thread stays readable.</param>
/// <param name="Messages">Oldest first.</param>
public sealed record ConversationResponse(
    Guid Id,
    string Kind,
    string? Subject,
    ConversationChallengeAreaResponse? ChallengeArea,
    ConversationInnovationResponse? Innovation,
    ConversationProblemReportResponse? ProblemReport,
    string SenderRole,
    bool AcceptsMessages,
    IReadOnlyList<MessageResponse> Messages,
    DateTimeOffset CreatedAt);
