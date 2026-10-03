namespace Castor.Api.Features.ProblemReports;

/// <summary>A report in the list of the signed-in user's reports.</summary>
public sealed record ProblemReportSummaryResponse(
    Guid Id,
    string TrackingCode,
    string Status,
    string Description,
    bool IsMatched,
    DateTimeOffset CreatedAt);
