namespace Castor.Api.Features.GrantCalls;

/// <summary>The whole content of the call; the dates are checked together.</summary>
public sealed record ReviseGrantCallRequest(
    string? Title,
    string? Description,
    IReadOnlyList<string>? Criteria,
    IReadOnlyList<string>? ChallengeAreaCodes,
    DateOnly? OpensOn,
    DateOnly? ClosesOn);
