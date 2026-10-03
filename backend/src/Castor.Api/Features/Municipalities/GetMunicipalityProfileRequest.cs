namespace Castor.Api.Features.Municipalities;

/// <param name="ChallengeArea">When set, the portrait also includes the indicators of that area. General indicators are always included.</param>
public sealed record GetMunicipalityProfileRequest(string? ChallengeArea);
