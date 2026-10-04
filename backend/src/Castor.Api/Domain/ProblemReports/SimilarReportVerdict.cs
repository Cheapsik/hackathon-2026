namespace Castor.Api.Domain;

/// <summary>
/// What the reporter said about one similar report shown with theirs. A later verdict on the same report replaces the
/// earlier one; yes also joins the report into that case (<see cref="ProblemReport.JoinedProblemReportId"/>).
/// </summary>
public sealed class SimilarReportVerdict
{
    private SimilarReportVerdict()
    {
    }

    public Guid Id { get; private set; }

    /// <summary>The report whose reporter decided.</summary>
    public Guid ProblemReportId { get; private set; }

    /// <summary>The similar report the verdict is about.</summary>
    public Guid SimilarProblemReportId { get; private set; }

    public Verdict Verdict { get; private set; }

    /// <summary>Anonymized; what differs or is missing — always there for almost.</summary>
    public string? Note { get; private set; }

    public DateTimeOffset DecidedAt { get; private set; }

    internal static SimilarReportVerdict Record(
        ProblemReport report,
        ProblemReport similar,
        Verdict verdict,
        string? note,
        DateTimeOffset decidedAt)
    {
        return new SimilarReportVerdict
        {
            Id = Guid.CreateVersion7(),
            ProblemReportId = report.Id,
            SimilarProblemReportId = similar.Id,
            Verdict = verdict,
            Note = note,
            DecidedAt = decidedAt,
        };
    }

    internal void Revise(Verdict verdict, string? note, DateTimeOffset decidedAt)
    {
        Verdict = verdict;
        Note = note;
        DecidedAt = decidedAt;
    }
}
