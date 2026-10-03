namespace Castor.Api.Features.FitAssessments;

/// <param name="Recalculate">An administrator's request to compute a stored card again.</param>
public sealed record CreateFitAssessmentRequest(
    string? Teryt,
    bool Recalculate);
