namespace Castor.Api.Shared;

/// <param name="Improvements">Concrete changes the author should consider, from the ratings.</param>
public sealed record FeedbackSummaryResult(IReadOnlyList<string>? Improvements);
