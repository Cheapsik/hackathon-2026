namespace Castor.Api.Queries;

/// <summary>
/// The case a report joined with "To moja sprawa", as its reporter follows it: anonymized text, gmina, status and how
/// many people joined — never its tracking code or thread.
/// </summary>
public sealed record JoinedCase(
    Guid Id,
    string Description,
    string? Municipality,
    ProblemReportStatus Status,
    int JoinedCount,
    DateTimeOffset CreatedAt);
