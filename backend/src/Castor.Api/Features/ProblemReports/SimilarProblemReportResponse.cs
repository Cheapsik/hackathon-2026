namespace Castor.Api.Features.ProblemReports;

/// <summary>An anonymized similar report shown next to results — never exposes another tracking code.</summary>
/// <param name="Verdict">NO, YES or ALMOST — what the reporter said about it; null until they decide.</param>
public sealed record SimilarProblemReportResponse(
    Guid Id,
    string Description,
    string? Municipality,
    string Status,
    string? Verdict,
    DateTimeOffset CreatedAt);
