namespace Castor.Api.Features.Ideas;

/// <param name="Stage">IDEA, PROTOTYPE, TESTED or READY; IDEA when empty.</param>
/// <param name="StartingInnovationId">A similar innovation the author takes as the starting point.</param>
public sealed record CreateIdeaRequest(
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
