namespace Castor.Api.Shared;

/// <param name="Title">The innovation under review.</param>
/// <param name="Feedback">Every rating left so far.</param>
public sealed record FeedbackSummaryInput(string Title, IReadOnlyList<FeedbackBrief> Feedback);
