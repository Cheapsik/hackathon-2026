namespace Castor.Api.Features.Conversations;

/// <summary>The report a thread is about — what an expert needs to answer it.</summary>
/// <param name="TrackingCode">Shown as XXXX-XXXX.</param>
/// <param name="Description">After anonymization.</param>
public sealed record ConversationProblemReportResponse(
    Guid Id,
    string TrackingCode,
    string Status,
    string Description,
    IReadOnlyList<string> ChallengeAreaCodes);
