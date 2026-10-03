namespace Castor.Api.Features.Radar;

public sealed record MunicipalityNeedResponse(
    string Teryt,
    string Name,
    int Reports,
    int Unmatched);
