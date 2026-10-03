namespace Castor.Api.Features.InnovationGenomes;

/// <param name="Status">DRAFT or APPROVED; all when left out.</param>
public sealed record ListInnovationGenomesRequest(
    string? Status);
