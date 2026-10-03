namespace Castor.Api.Shared;

/// <summary>Input of the hybrid prompt.</summary>
public sealed record HybridProposalInput(
    string Problem,
    IReadOnlyList<CandidateInnovation> Candidates);
