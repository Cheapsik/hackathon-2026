namespace Castor.Api.Features.BackgroundJobs;

public sealed record BackgroundJobResponse(
    Guid Id,
    string Kind,
    string Status,
    int? Total,
    int Done,
    int Failed,
    string? Error,
    DateTimeOffset CreatedAt,
    DateTimeOffset? StartedAt,
    DateTimeOffset? FinishedAt);
