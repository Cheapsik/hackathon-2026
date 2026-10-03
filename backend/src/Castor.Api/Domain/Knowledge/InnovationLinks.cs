namespace Castor.Api.Domain;

/// <summary>Where the card and its materials live at ROPS; the platform links them and keeps no copy.</summary>
public sealed record InnovationLinks(
    string? CardUrl,
    string? VideoUrl,
    string? MaterialsZipUrl,
    string? CardPdfUrl,
    string? TermsUrl);
