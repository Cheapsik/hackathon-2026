namespace Castor.Api.Features.ProblemReports;

/// <summary>One innovation proposed for the report.</summary>
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
    string? CardUrl);
