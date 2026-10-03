namespace Castor.Api.Features.Innovations;

/// <summary>An innovation card: the six sections, the linked materials and the challenge areas of its genome.</summary>
public sealed record InnovationResponse(
    Guid Id,
    string Title,
    string? ShortDescription,
    IReadOnlyList<string> Categories,
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
    bool Featured,
    bool InServiceModel,
    string Stage,
    IReadOnlyList<string> ChallengeAreaCodes);
