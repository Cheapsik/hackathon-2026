namespace Castor.Api.Features.Municipalities;

/// <summary>A gmina's Obserwator figures for one challenge area (and the general indicators), next to the region average.</summary>
public sealed record MunicipalityProfileResponse(
    string Teryt,
    string Name,
    string QualifiedName,
    string Powiat,
    IReadOnlyList<ProfileIndicatorResponse> Indicators);
