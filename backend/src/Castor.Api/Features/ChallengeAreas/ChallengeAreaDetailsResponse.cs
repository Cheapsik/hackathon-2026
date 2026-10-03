namespace Castor.Api.Features.ChallengeAreas;

/// <param name="PlainText">The approved plain-language definition; null until an administrator approves one.</param>
public sealed record ChallengeAreaDetailsResponse(
    string Code,
    int Number,
    string Name,
    string Definition,
    IReadOnlyList<string> KeyChallenges,
    string Source,
    string? PlainText,
    IReadOnlyList<PersonaResponse> Personas);
