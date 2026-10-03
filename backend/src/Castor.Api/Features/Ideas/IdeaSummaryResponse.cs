namespace Castor.Api.Features.Ideas;

/// <param name="Mine">The reader is an author or co-author.</param>
/// <param name="ReviewedByMe">The reader, an expert, has reviewed it.</param>
public sealed record IdeaSummaryResponse(
    Guid Id,
    string Title,
    string Status,
    IReadOnlyList<string> ChallengeAreaCodes,
    string Stage,
    bool Mine,
    bool ReviewedByMe,
    DateTimeOffset? SubmittedAt,
    DateTimeOffset UpdatedAt);
