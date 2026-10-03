namespace Castor.Api.Features.Users;

internal static class UserConverter
{
    public static UserResponse ToResponse(this User user, Municipality? municipality)
    {
        string role = user.Role.ToString();
        UserMunicipalityResponse? municipalityResponse = municipality is null
            ? null
            : new UserMunicipalityResponse(municipality.Teryt, municipality.QualifiedName);

        return new UserResponse(user.Id, user.Email, role, municipalityResponse, user.ChallengeAreaCodes, user.CreatedAt);
    }
}
