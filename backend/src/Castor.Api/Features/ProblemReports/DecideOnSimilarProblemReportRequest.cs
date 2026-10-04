namespace Castor.Api.Features.ProblemReports;

/// <param name="Verdict">NO, YES or ALMOST.</param>
/// <param name="Note">What differs or is missing; required for ALMOST.</param>
public sealed record DecideOnSimilarProblemReportRequest(string? Verdict, string? Note);
