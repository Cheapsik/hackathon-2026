namespace Castor.Api.Features.GrantApplications;

/// <param name="CanEdit">The reader is an author of the idea.</param>
public sealed record GrantApplicationResponse(
    Guid Id,
    Guid IdeaId,
    string IdeaTitle,
    Guid GrantCallId,
    string GrantCallTitle,
    bool GrantCallOpen,
    string Title,
    string? Summary,
    IReadOnlyList<GrantApplicationAnswerResponse> Answers,
    bool CanEdit,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
