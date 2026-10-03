namespace Castor.Api.Domain;

/// <summary>What an assessment says, as one value, so creating and recalculating a card go through the same rules.</summary>
public sealed record FitAssessmentContent(
    FitLevel Fit,
    string Summary,
    IReadOnlyList<string> Unchanged,
    IReadOnlyList<string> ToAdapt,
    IReadOnlyList<string> Missing,
    string? ServiceProvider,
    string? ServiceForm,
    string? ScaleEstimate,
    IReadOnlyList<FitComparisonRow> Comparison);
