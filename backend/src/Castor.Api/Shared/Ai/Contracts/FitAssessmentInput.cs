namespace Castor.Api.Shared;

/// <summary>Input of the fit prompt.</summary>
public sealed record FitAssessmentInput(
    FitInnovationBrief Innovation,
    FitMunicipalityBrief Municipality,
    IReadOnlyList<FitIndicatorBrief> Indicators,
    IReadOnlyList<string> ServiceModelExamples);
