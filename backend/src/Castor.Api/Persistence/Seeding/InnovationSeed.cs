namespace Castor.Api.Persistence;

/// <summary>One entry of data/seed/innovations.json.</summary>
public sealed record InnovationSeed(
    string SourceKey,
    string Title,
    string? ShortDescription,
    string? CardUrl,
    bool Featured,
    string? CardPdfUrl,
    string? VideoUrl,
    string? MaterialsZipUrl,
    string? TermsUrl,
    InnovationSectionsSeed Sections,
    string? Organization,
    List<string> Categories,
    bool InServiceModel);
