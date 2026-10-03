namespace Castor.Api.Features.Ideas;

/// <summary>The choices of the Social Innovation Canvas, so the Kreator renders the card from the same list the API checks.</summary>
public sealed record IdeaCanvasResponse(
    IReadOnlyList<CanvasScaleLevelResponse> Intensity,
    IReadOnlyList<CanvasScaleLevelResponse> Frequency,
    IReadOnlyList<CanvasScaleLevelResponse> Scale,
    IReadOnlyList<CanvasOptionResponse> Recipients,
    IReadOnlyList<CanvasOptionResponse> EmotionalValues,
    IReadOnlyList<CanvasOptionResponse> FunctionalValues,
    IReadOnlyList<CanvasOptionResponse> Stages,
    int MaxValues,
    int MaxChallengeAreas);
