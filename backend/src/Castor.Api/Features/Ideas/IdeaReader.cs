namespace Castor.Api.Features.Ideas;

/// <summary>Who reads an idea: what decides the flags and sections of <see cref="IdeaResponse"/>.</summary>
/// <param name="ExpertChallengeAreaCodes">Empty for a reader who is not an expert.</param>
public sealed record IdeaReader(
    Guid UserId,
    bool IsAdmin,
    IReadOnlyList<string> ExpertChallengeAreaCodes);
