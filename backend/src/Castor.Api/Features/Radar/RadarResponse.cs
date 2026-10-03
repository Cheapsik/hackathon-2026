namespace Castor.Api.Features.Radar;

/// <summary>Trends of needs and blank spots — for administrators only (brief).</summary>
public sealed record RadarResponse(
    DateOnly From,
    DateOnly To,
    int Reports,
    IReadOnlyList<AreaNeedResponse> ByArea,
    IReadOnlyList<MunicipalityNeedResponse> ByMunicipality,
    IReadOnlyList<MonthlyNeedResponse> ByMonth,
    IReadOnlyList<BlankSpotResponse> BlankSpots);
