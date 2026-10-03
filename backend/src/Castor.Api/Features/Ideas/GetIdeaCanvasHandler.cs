namespace Castor.Api.Features.Ideas;

/// <summary>The choices of the Social Innovation Canvas, open to everyone like the Canvas itself.</summary>
public sealed class GetIdeaCanvasHandler
{
    public IdeaCanvasResponse Handle()
    {
        return new IdeaCanvasResponse(
            Levels(CanvasOptions.Intensity),
            Levels(CanvasOptions.Frequency),
            Levels(CanvasOptions.Scale),
            Options(CanvasOptions.Recipients),
            Options(CanvasOptions.EmotionalValues),
            Options(CanvasOptions.FunctionalValues),
            Options(CanvasOptions.Stages),
            CanvasOptions.MaxValues,
            Idea.MaxChallengeAreas);
    }

    private static List<CanvasScaleLevelResponse> Levels(IReadOnlyList<CanvasScaleLevel> levels)
    {
        return [.. levels.Select(level => new CanvasScaleLevelResponse(level.Level, level.Label, level.Hint))];
    }

    private static List<CanvasOptionResponse> Options(IReadOnlyList<CanvasOption> options)
    {
        return [.. options.Select(option => new CanvasOptionResponse(option.Code, option.Label, option.Hint))];
    }
}
