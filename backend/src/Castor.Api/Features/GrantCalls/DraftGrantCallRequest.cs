namespace Castor.Api.Features.GrantCalls;

/// <summary>A blank spot of the radar to draft a call for: an area, and a gmina or the whole region.</summary>
public sealed record DraftGrantCallRequest(
    string? ChallengeAreaCode,
    string? Teryt);
