namespace Castor.Api.Shared;

/// <summary>A hybrid as the model proposed it; the ids are checked against the candidates.</summary>
public sealed record HybridProposalResult(
    string? Name,
    string? Description,
    IReadOnlyList<Guid>? SourceInnovationIds,
    string? WhyTogether);
