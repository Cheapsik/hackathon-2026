namespace Castor.Api.Domain;

/// <summary>
/// What a user writes on an idea card (SPEC 7 III): the problem on three four-step scales, recipients, the essence of
/// the solution, its stage, the actors of change and the value for recipients. Codes are checked by <see cref="Idea"/>.
/// </summary>
public sealed record IdeaCanvas(
    string? Title,
    int? ProblemIntensity,
    int? ProblemFrequency,
    int? ProblemScale,
    IReadOnlyList<string> Recipients,
    string? OtherRecipients,
    string? Solution,
    InnovationStage Stage,
    string? Supporters,
    string? Opponents,
    IReadOnlyList<string> EmotionalValues,
    IReadOnlyList<string> FunctionalValues,
    string? DifferenceNote);
