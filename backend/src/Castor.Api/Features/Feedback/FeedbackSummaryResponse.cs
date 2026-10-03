namespace Castor.Api.Features.Feedback;

public sealed record FeedbackSummaryResponse(
    Guid InnovationId,
    string InnovationTitle,
    int Ratings,
    double AverageStars,
    IReadOnlyList<string> Improvements);
