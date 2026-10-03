namespace Castor.Api.Features.ProblemReports;

/// <param name="TrackingCode">Shown as XXXX-XXXX.</param>
/// <param name="Description">After anonymization.</param>
/// <param name="OriginalDescription">Only for the author and administrators, and only when consent was given.</param>
/// <param name="AwaitsAnswers">The clarifying questions wait for answers; matching runs after them.</param>
/// <param name="HasAuthor">False for an anonymous report that can still be claimed with its code.</param>
/// <param name="ConversationId">The report's thread; a visitor opens it with the same tracking code.</param>
public sealed record ProblemReportResponse(
    Guid Id,
    string TrackingCode,
    string Status,
    string Channel,
    bool SubmittedOnBehalf,
    string Description,
    string? OriginalDescription,
    ProblemReportMunicipalityResponse? Municipality,
    IReadOnlyList<ProblemReportChallengeAreaResponse> ChallengeAreas,
    IReadOnlyList<ClarifyingQuestionResponse> ClarifyingQuestions,
    bool AwaitsAnswers,
    bool IsMatched,
    bool HasAuthor,
    IReadOnlyList<MatchResponse> Matches,
    HybridResponse? Hybrid,
    SimilarProblemReportsResponse SimilarReports,
    Guid ConversationId,
    DateTimeOffset CreatedAt);
