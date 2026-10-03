namespace Castor.Api.Features.ProblemReports;

/// <param name="Status">One status; all of them when left out.</param>
/// <param name="ChallengeArea">The code of the report's main challenge area.</param>
public sealed record ListInboxProblemReportsRequest(
    string? Status,
    string? ChallengeArea,
    string? Teryt);
