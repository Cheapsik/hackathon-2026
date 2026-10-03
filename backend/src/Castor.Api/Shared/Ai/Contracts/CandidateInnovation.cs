namespace Castor.Api.Shared;

/// <summary>An innovation the ranking may choose, described by its genome.</summary>
public sealed record CandidateInnovation(
    Guid InnovationId,
    string Title,
    string Summary,
    IReadOnlyList<string> RootCauses,
    IReadOnlyList<string> Mechanisms,
    IReadOnlyList<string> TargetGroups,
    IReadOnlyList<string> ChallengeAreaCodes);
