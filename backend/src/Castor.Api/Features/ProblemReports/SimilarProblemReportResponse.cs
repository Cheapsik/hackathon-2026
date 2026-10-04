namespace Castor.Api.Features.ProblemReports;

/// <summary>An anonymized similar report shown next to results — never exposes another tracking code.</summary>
public sealed record SimilarProblemReportResponse(
    Guid Id,
    string Description,
    string? Municipality,
    DateTimeOffset CreatedAt);
