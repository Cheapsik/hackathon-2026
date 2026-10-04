namespace Castor.Api.Features.ProblemReports;

/// <summary>The case a report joined: its anonymized text, gmina and status, and how many people joined it.</summary>
public sealed record JoinedCaseResponse(
    Guid Id,
    string Description,
    string? Municipality,
    string Status,
    int JoinedCount,
    DateTimeOffset CreatedAt);
