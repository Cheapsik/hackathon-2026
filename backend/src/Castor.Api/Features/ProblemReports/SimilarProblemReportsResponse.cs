namespace Castor.Api.Features.ProblemReports;

/// <summary>"Podobny problem zgłosiło N osób z M gmin", plus one page of concrete examples.</summary>
public sealed record SimilarProblemReportsResponse(
    int Reports,
    int Municipalities,
    IReadOnlyList<SimilarProblemReportResponse> Items);
