namespace Castor.Api.Shared;

/// <summary>The innovation as the fit prompt sees it: its genome and whether it is already a Małopolska service model.</summary>
public sealed record FitInnovationBrief(
    string Title,
    string Summary,
    IReadOnlyList<string> Mechanisms,
    IReadOnlyList<string> TargetGroups,
    IReadOnlyList<string> RequiredInstitutions,
    IReadOnlyList<string> RequiredPeople,
    string? RequiredBudget,
    IReadOnlyList<string> RequiredInfrastructure,
    string? Scale,
    IReadOnlyList<string> ChallengeAreaCodes,
    bool InServiceModel);
