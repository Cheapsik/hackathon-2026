namespace Castor.Api.Features.GrantApplications;

public sealed record GrantApplicationSummaryResponse(
    Guid Id,
    Guid IdeaId,
    string IdeaTitle,
    string Title,
    int AnsweredCriteria,
    int Criteria,
    DateTimeOffset UpdatedAt);
