namespace Castor.Api.Queries;

/// <summary>"A similar problem was reported by <see cref="Reports"/> people from <see cref="Municipalities"/> gminy."</summary>
public sealed record SimilarProblemReports(
    int Reports,
    int Municipalities,
    IReadOnlyList<SimilarProblemReportItem> Items);
