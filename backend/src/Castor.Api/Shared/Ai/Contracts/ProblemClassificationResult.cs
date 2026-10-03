namespace Castor.Api.Shared;

/// <summary>What the language model returns for a problem report; validated by <see cref="ProblemClassifier"/>.</summary>
public sealed record ProblemClassificationResult(
    IReadOnlyList<string>? ChallengeAreaCodes,
    IReadOnlyList<string>? RootCauses,
    string? TargetGroup,
    string? Urgency,
    IReadOnlyList<string>? Keywords,
    IReadOnlyList<string>? ClarifyingQuestions);
