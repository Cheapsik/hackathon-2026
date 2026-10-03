namespace Castor.Api.Features.Radar;

/// <summary>A cluster of reports the library has no good answer for: one area in one gmina (or with no gmina given).</summary>
public sealed record BlankSpotResponse(
    string ChallengeAreaCode,
    string ChallengeAreaName,
    string? Teryt,
    string? Municipality,
    int UnmatchedReports);
