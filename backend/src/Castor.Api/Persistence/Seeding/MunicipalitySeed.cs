namespace Castor.Api.Persistence;

/// <summary>One entry of data/seed/municipalities.json.</summary>
public sealed record MunicipalitySeed(
    string Teryt,
    string Name,
    string Type,
    string Powiat);
