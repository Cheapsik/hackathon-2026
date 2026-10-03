namespace Castor.Api.Features.Ideas;

/// <summary>The whole card at once, like <see cref="CreateIdeaRequest"/>.</summary>
public sealed record ReviseIdeaRequest(
    string? Title,
    IReadOnlyList<string>? ChallengeAreaCodes,
    int? ProblemIntensity,
    int? ProblemFrequency,
    int? ProblemScale,
    IReadOnlyList<string>? Recipients,
    string? OtherRecipients,
    string? Solution,
    string? Stage,
    string? Supporters,
    string? Opponents,
    IReadOnlyList<string>? EmotionalValues,
    IReadOnlyList<string>? FunctionalValues,
    string? DifferenceNote,
    Guid? StartingInnovationId);
