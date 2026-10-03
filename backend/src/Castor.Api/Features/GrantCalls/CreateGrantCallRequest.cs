namespace Castor.Api.Features.GrantCalls;

public sealed record CreateGrantCallRequest(
    string? Title,
    string? Description,
    IReadOnlyList<string>? Criteria,
    IReadOnlyList<string>? ChallengeAreaCodes,
    DateOnly? OpensOn,
    DateOnly? ClosesOn);
