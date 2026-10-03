namespace Castor.Api.Features.Users;

public sealed record UserResponse(
    Guid Id,
    string Email,
    string Role,
    UserMunicipalityResponse? Municipality,
    IReadOnlyList<string> ChallengeAreaCodes,
    DateTimeOffset CreatedAt);
