namespace Castor.Api.Features.Innovations;

/// <param name="Stage">IDEA, PROTOTYPE, TESTED or READY.</param>
public sealed record CreateInnovationRequest(
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
