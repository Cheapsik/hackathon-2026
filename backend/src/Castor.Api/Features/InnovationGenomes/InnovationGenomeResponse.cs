namespace Castor.Api.Features.InnovationGenomes;

public sealed record InnovationGenomeResponse(
    Guid Id,
    Guid InnovationId,
    string InnovationTitle,
    string Status,
    IReadOnlyList<string> RootCauses,
    IReadOnlyList<string> Mechanisms,
    IReadOnlyList<string> TargetGroups,
    IReadOnlyList<string> RequiredInstitutions,
    IReadOnlyList<string> RequiredPeople,
    string? RequiredBudget,
    IReadOnlyList<string> RequiredInfrastructure,
    string? Scale,
    IReadOnlyList<string> ChallengeAreaCodes,
    string Summary,
    DateTimeOffset? ApprovedAt,
    DateTimeOffset UpdatedAt);
