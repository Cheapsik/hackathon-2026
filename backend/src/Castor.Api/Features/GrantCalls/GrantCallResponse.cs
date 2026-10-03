namespace Castor.Api.Features.GrantCalls;

public sealed record GrantCallResponse(
    Guid Id,
    string Title,
    string? Description,
    IReadOnlyList<string> Criteria,
    IReadOnlyList<string> ChallengeAreaCodes,
    DateOnly? OpensOn,
    DateOnly? ClosesOn,
    string Status,
    bool IsOpen,
    DateTimeOffset UpdatedAt);
