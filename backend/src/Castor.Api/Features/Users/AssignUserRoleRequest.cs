namespace Castor.Api.Features.Users;

/// <param name="MunicipalityTeryt">Required for MUNICIPAL_OFFICER, ignored otherwise.</param>
/// <param name="ChallengeAreaCodes">At least one for EXPERT, ignored otherwise.</param>
public sealed record AssignUserRoleRequest(
    string? Role,
    string? MunicipalityTeryt,
    IReadOnlyList<string>? ChallengeAreaCodes);
