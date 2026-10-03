namespace Castor.Api.Features.Ideas;

/// <summary>
/// An idea card with what the reader may do with it. The duplicate check, reviews and applications are shown to the
/// authors and administrators; an expert sees only their own review.
/// </summary>
/// <param name="MissingForSubmission">Request field names the card still lacks before submitting.</param>
/// <param name="SimilarIsCurrent">Whether the duplicate check read the card as it is now.</param>
/// <param name="Reviews">Null for a reader who may not read them.</param>
/// <param name="InnovationId">The innovation the idea grew into.</param>
public sealed record IdeaResponse(
    Guid Id,
    string Status,
    string Title,
    IReadOnlyList<IdeaChallengeAreaResponse> ChallengeAreas,
    int? ProblemIntensity,
    int? ProblemFrequency,
    int? ProblemScale,
    IReadOnlyList<string> Recipients,
    string? OtherRecipients,
    string? Solution,
    string Stage,
    string? Supporters,
    string? Opponents,
    IReadOnlyList<string> EmotionalValues,
    IReadOnlyList<string> FunctionalValues,
    string? DifferenceNote,
    IReadOnlyList<IdeaInnovationResponse> FromHybridOf,
    IdeaInnovationResponse? StartingInnovation,
    IReadOnlyList<IdeaSimilarityResponse> Similar,
    DateTimeOffset? SimilarCheckedAt,
    bool SimilarIsCurrent,
    IReadOnlyList<string> MissingForSubmission,
    int CoAuthorCount,
    bool IsAuthor,
    bool CanEdit,
    bool CanSubmit,
    bool CanJoin,
    bool CanReview,
    bool CanDecide,
    bool CanConvert,
    bool CanApply,
    bool SeeksTesters,
    bool CanToggleSeeksTesters,
    IReadOnlyList<IdeaReviewResponse>? Reviews,
    IdeaReviewResponse? MyReview,
    Guid? InnovationId,
    IReadOnlyList<IdeaGrantApplicationResponse> GrantApplications,
    DateTimeOffset? SubmittedAt,
    DateTimeOffset? DecidedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
