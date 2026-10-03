namespace Castor.Api.Persistence;

public sealed record DemoTesterProfileSeed(
    int Age,
    string MunicipalityTeryt,
    string? AccessibilityNeeds,
    string? Equipment);
