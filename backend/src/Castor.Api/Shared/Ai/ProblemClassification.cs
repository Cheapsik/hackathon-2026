namespace Castor.Api.Shared;

/// <summary>A validated classification: only known challenge areas, at most three questions.</summary>
public sealed record ProblemClassification(
    IReadOnlyList<ChallengeArea> ChallengeAreas,
    IReadOnlyList<string> RootCauses,
    string? TargetGroup,
    ProblemReportUrgency? Urgency,
    IReadOnlyList<string> Keywords,
    IReadOnlyList<string> ClarifyingQuestions);
