namespace Castor.Api.Queries;

/// <summary>"A similar problem was reported by <see cref="Reports"/> people from <see cref="Municipalities"/> gminy."</summary>
/// <param name="Cases">The reports among them that are cases of their own — what <see cref="Items"/> pages through.</param>
public sealed record SimilarProblemReports(
    int Reports,
    int Municipalities,
    int Cases,
    IReadOnlyList<SimilarProblemReportItem> Items);
