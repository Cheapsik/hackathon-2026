namespace Castor.Api.Shared;

/// <summary>The gmina as the fit prompt sees it.</summary>
public sealed record FitMunicipalityBrief(
    string Name,
    string Type,
    string Powiat);
