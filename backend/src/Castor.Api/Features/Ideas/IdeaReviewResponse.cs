namespace Castor.Api.Features.Ideas;

/// <summary>A review without the expert's name.</summary>
public sealed record IdeaReviewResponse(
    Guid Id,
    string Recommendation,
    string Comment,
    bool Mine,
    DateTimeOffset UpdatedAt);
