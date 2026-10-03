namespace Castor.Api.Features.InnovationGenomes;

/// <summary>The whole corrected genome; saving it approves it.</summary>
public sealed record ReviseInnovationGenomeRequest(
    IReadOnlyList<string>? RootCauses,
    IReadOnlyList<string>? Mechanisms,
    IReadOnlyList<string>? TargetGroups,
    IReadOnlyList<string>? RequiredInstitutions,
    IReadOnlyList<string>? RequiredPeople,
    string? RequiredBudget,
    IReadOnlyList<string>? RequiredInfrastructure,
    string? Scale,
    IReadOnlyList<string>? ChallengeAreaCodes,
    string? Summary);
