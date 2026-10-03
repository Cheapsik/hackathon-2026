namespace Castor.Api.Features.Session;

/// <summary>Who the session belongs to; a visitor without an account gets SignedIn = false.</summary>
/// <param name="MunicipalityTeryt">The gmina of a municipal officer, suggested on the fit card (SPEC 6.5).</param>
public sealed record SessionResponse(
    bool SignedIn,
    Guid? UserId,
    string? Email,
    string? Role,
    string? MunicipalityTeryt);
