namespace Castor.Api.Features.Innovations;

/// <summary>The whole card; section 1 and the title are required.</summary>
public sealed record ReviseInnovationRequest(
    string? Title,
    string? ShortDescription,
    IReadOnlyList<string>? Categories,
    string? Solution,
    string? Problems,
    string? TargetGroup,
    string? Beneficiaries,
    string? Evidence,
    string? Organization,
    string? CardUrl,
    string? VideoUrl,
    string? MaterialsZipUrl,
    string? CardPdfUrl,
    string? TermsUrl,
    string? Stage);
