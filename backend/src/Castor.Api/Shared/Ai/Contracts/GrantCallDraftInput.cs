namespace Castor.Api.Shared;

/// <summary>Input of the grant call prompt: a blank spot — an area with reports and no fitting innovation.</summary>
public sealed record GrantCallDraftInput(
    string ChallengeArea,
    string AreaDefinition,
    string? Municipality,
    int Reports,
    IReadOnlyList<string> SampleProblems);
