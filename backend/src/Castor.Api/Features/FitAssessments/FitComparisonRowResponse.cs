namespace Castor.Api.Features.FitAssessments;

/// <param name="Level">GMINA, or POWIAT when the Obserwator has the indicator only per powiat.</param>
public sealed record FitComparisonRowResponse(
    string Requirement,
    string IndicatorName,
    string? Unit,
    string Level,
    decimal Value,
    decimal RegionAverage,
    int Year);
