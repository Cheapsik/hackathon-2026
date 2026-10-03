namespace Castor.Api.Features.Municipalities;

public sealed record MunicipalityResponse(
    string Teryt,
    string Name,
    string QualifiedName,
    string Type,
    string Powiat);
