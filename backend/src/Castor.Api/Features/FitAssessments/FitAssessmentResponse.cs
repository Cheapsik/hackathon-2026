namespace Castor.Api.Features.FitAssessments;

/// <summary>"Karta dopasowania do gminy" (SPEC 6.5).</summary>
/// <param name="Fit">HIGH, MEDIUM or LOW.</param>
public sealed record FitAssessmentResponse(
    Guid Id,
    Guid InnovationId,
    string InnovationTitle,
    FitAssessmentMunicipalityResponse Municipality,
    int DataYear,
    string Fit,
    string Summary,
    IReadOnlyList<string> Unchanged,
    IReadOnlyList<string> ToAdapt,
    IReadOnlyList<string> Missing,
    string? ServiceProvider,
    string? ServiceForm,
    string? ScaleEstimate,
    IReadOnlyList<FitComparisonRowResponse> Comparison,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
