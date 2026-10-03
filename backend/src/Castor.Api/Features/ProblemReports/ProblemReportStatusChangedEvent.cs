namespace Castor.Api.Features.ProblemReports;

/// <summary>Sent to administrators and to the author when a report moves to another status.</summary>
public sealed record ProblemReportStatusChangedEvent(
    Guid Id,
    string Status,
    DateTimeOffset ChangedAt);
