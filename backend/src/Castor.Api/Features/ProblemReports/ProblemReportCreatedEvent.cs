namespace Castor.Api.Features.ProblemReports;

/// <summary>Sent to administrators the moment a report arrives (SignalR, group admins).</summary>
public sealed record ProblemReportCreatedEvent(
    Guid Id,
    string Channel,
    string? MunicipalityName,
    DateTimeOffset CreatedAt);
