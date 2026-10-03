namespace Castor.Api.Domain;

/// <summary>Sections 1–5 of an innovation card; section 6 (Authors) is reduced to the organization.</summary>
public sealed record InnovationCardSections(
    string? Solution,
    string? Problems,
    string? TargetGroup,
    string? Beneficiaries,
    string? Evidence);
