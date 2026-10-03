namespace Castor.Api.Persistence;

/// <summary>Sections 1–5 of a card in data/seed/innovations.json.</summary>
public sealed record InnovationSectionsSeed(
    string? Solution,
    string? Problems,
    string? TargetGroup,
    string? Beneficiaries,
    string? Evidence);
