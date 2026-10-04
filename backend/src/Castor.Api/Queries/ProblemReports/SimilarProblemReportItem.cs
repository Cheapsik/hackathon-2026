namespace Castor.Api.Queries;

/// <summary>One other report with the same main challenge area — anonymized text only, never a tracking code.</summary>
public sealed record SimilarProblemReportItem(
    Guid Id,
    string Description,
    string? Municipality,
    DateTimeOffset CreatedAt);
