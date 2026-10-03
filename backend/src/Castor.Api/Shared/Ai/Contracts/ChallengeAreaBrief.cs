namespace Castor.Api.Shared;

/// <summary>A challenge area as the language model sees it.</summary>
public sealed record ChallengeAreaBrief(
    string Code,
    string Name,
    string Definition);
