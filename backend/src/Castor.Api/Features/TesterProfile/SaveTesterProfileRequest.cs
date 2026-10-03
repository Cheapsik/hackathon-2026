namespace Castor.Api.Features.TesterProfile;

public sealed record SaveTesterProfileRequest(
    int? Age,
    string? MunicipalityTeryt,
    string? AccessibilityNeeds,
    string? Equipment);
