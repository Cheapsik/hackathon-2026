namespace Castor.Api.Persistence;

/// <summary>One entry of data/seed/indicator_values.json.</summary>
public sealed record IndicatorValueSeed(
    int IndicatorId,
    string Level,
    string Teryt,
    int Year,
    decimal Value);
