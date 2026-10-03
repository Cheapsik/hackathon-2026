namespace Castor.Api.Shared;

/// <summary>Required resources as the model describes them.</summary>
public sealed record GenomeRequiredResourcesResult(
    IReadOnlyList<string>? Institutions,
    IReadOnlyList<string>? People,
    string? Budget,
    IReadOnlyList<string>? Infrastructure);
