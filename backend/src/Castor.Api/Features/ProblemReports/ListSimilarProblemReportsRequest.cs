namespace Castor.Api.Features.ProblemReports;

/// <param name="Skip">How many similar reports to skip; the first page starts at 0.</param>
/// <param name="Take">Page size; defaults to the first-page size when left out.</param>
public sealed record ListSimilarProblemReportsRequest(
    int? Skip,
    int? Take);
