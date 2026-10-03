namespace Castor.Api.Shared;

/// <summary>What the language model returns for an innovation card; validated by <see cref="GenomeGenerator"/>.</summary>
public sealed record GenomeResult(
    IReadOnlyList<string>? RootCauses,
    IReadOnlyList<string>? Mechanisms,
    IReadOnlyList<string>? TargetGroups,
    GenomeRequiredResourcesResult? RequiredResources,
    string? Scale,
    IReadOnlyList<string>? ChallengeAreaCodes,
    string? Summary);
