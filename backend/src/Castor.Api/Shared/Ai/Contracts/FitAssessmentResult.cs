namespace Castor.Api.Shared;

/// <summary>What the language model returns for a fit assessment; validated by <see cref="FitAssessor"/>.</summary>
public sealed record FitAssessmentResult(
    string? Fit,
    string? Summary,
    IReadOnlyList<string>? Unchanged,
    IReadOnlyList<string>? ToAdapt,
    IReadOnlyList<string>? Missing,
    string? ServiceProvider,
    string? ServiceForm,
    string? ScaleEstimate,
    IReadOnlyList<FitComparisonChoice>? Comparison);
