namespace Castor.Api.Persistence;

/// <summary>A demo account; every one signs in with the password from <c>Seed:DemoPassword</c>.</summary>
/// <param name="Key">How the rest of demo_content.json refers to this account.</param>
/// <param name="Role">RESIDENT, MUNICIPAL_OFFICER (with a gmina), EXPERT (with areas) or ADMIN.</param>
public sealed record DemoAccountSeed(
    string Key,
    string Email,
    string Role,
    string? MunicipalityTeryt,
    List<string> ChallengeAreas,
    DemoTesterProfileSeed? TesterProfile);
