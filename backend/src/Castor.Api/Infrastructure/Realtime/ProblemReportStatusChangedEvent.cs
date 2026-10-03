namespace Castor.Api.Infrastructure;

/// <summary>Sent to everyone who may see the report (<see cref="LiveHub.ProblemReportGroups"/>) when it changes status.</summary>
public sealed record ProblemReportStatusChangedEvent(
    Guid Id,
    string Status,
    DateTimeOffset ChangedAt);
