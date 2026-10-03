namespace Castor.Api.Features.TesterProfile;

public sealed record TesterProfileResponse(
    int Age,
    string MunicipalityTeryt,
    string MunicipalityName,
    string AccessibilityNeeds,
    string Equipment);
