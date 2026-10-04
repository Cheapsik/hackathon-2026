namespace Castor.Api.Features.ProblemReports;

/// <summary>"Podobny problem zgłosiło N osób z M gmin", plus one page of concrete examples.</summary>
/// <param name="Cases">How many examples there are to page through: reports that joined a case are not examples.</param>
public sealed record SimilarProblemReportsResponse(
    int Reports,
    int Municipalities,
    int Cases,
    IReadOnlyList<SimilarProblemReportResponse> Items);
