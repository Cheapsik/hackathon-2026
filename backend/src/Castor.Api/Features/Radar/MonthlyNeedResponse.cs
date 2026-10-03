namespace Castor.Api.Features.Radar;

/// <param name="Month">YYYY-MM.</param>
public sealed record MonthlyNeedResponse(
    string Month,
    string ChallengeAreaCode,
    int Reports);
