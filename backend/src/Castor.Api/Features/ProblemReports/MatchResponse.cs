namespace Castor.Api.Features.ProblemReports;

/// <summary>One innovation proposed for the report.</summary>
/// <param name="Verdict">NO, YES or ALMOST — what the reporter said about it; null until they decide.</param>
public sealed record MatchResponse(
    int Position,
    int Score,
    Guid InnovationId,
    string Title,
    string? ShortDescription,
    string Justification,
    IReadOnlyList<string> CitedFields,
    string? Adaptation,
    string? VideoUrl,
    string? CardUrl,
    string? Verdict);
