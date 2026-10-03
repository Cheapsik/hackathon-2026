namespace Castor.Api.Features.ProblemReports;

/// <summary>"Podobny problem zgłosiło N osób z M gmin".</summary>
public sealed record SimilarProblemReportsResponse(
    int Reports,
    int Municipalities);
