namespace Castor.Api.Features.FitAssessments;

/// <summary>A card and whether this request generated it (201) or found it stored (200).</summary>
public sealed record FitAssessmentOutcome(
    FitAssessmentResponse Response,
    bool Created);
