namespace Castor.Api.Queries;

/// <summary>One other report with the same main challenge area — anonymized text only, never a tracking code.</summary>
/// <param name="Verdict">What the viewing report's reporter said about it; null until they decide.</param>
public sealed record SimilarProblemReportItem(
    Guid Id,
    string Description,
    string? Municipality,
    ProblemReportStatus Status,
    Verdict? Verdict,
    DateTimeOffset CreatedAt);
