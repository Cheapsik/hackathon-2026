namespace Castor.Api.Domain;

/// <summary>
/// An innovation or a hybrid proposed for a problem report, with its position, score and justification. Stored, so a
/// report is matched once and shows the same result every time. Ideas (module III) will get their matches here too.
/// </summary>
public sealed class MatchResult
{
    public const int MinScore = 0;

    public const int MaxScore = 100;

    public const int MinHybridSources = 2;

    public const int MaxHybridSources = 3;

    private MatchResult()
    {
    }

    public Guid Id { get; private set; }

    public Guid ProblemReportId { get; private set; }

    public MatchKind Kind { get; private set; }

    /// <summary>1 for the best match; a hybrid comes after the matches.</summary>
    public int Position { get; private set; }

    /// <summary>0–100 for a match; null for a hybrid, which is a proposal rather than a fit.</summary>
    public int? Score { get; private set; }

    /// <summary>The innovation of a match; null for a hybrid.</summary>
    public Guid? InnovationId { get; private set; }

    public Innovation? Innovation { get; private set; }

    /// <summary>Why it fits (a match) or why the innovations work together (a hybrid).</summary>
    public string Justification { get; private set; } = null!;

    /// <summary>The card or genome fields the justification relies on.</summary>
    public List<string> CitedFields { get; private set; } = [];

    /// <summary>What has to be adapted for this problem; null when nothing was named.</summary>
    public string? Adaptation { get; private set; }

    public string? HybridName { get; private set; }

    public string? HybridDescription { get; private set; }

    /// <summary>The two or three innovations a hybrid is made of.</summary>
    public List<Guid> SourceInnovationIds { get; private set; } = [];

    public DateTimeOffset CreatedAt { get; private set; }

    /// <summary>The reporter's verdict on this innovation; null until they decide. A later one replaces it.</summary>
    public Verdict? Verdict { get; private set; }

    /// <summary>Anonymized; for almost, what the innovation lacks — it never changes the ROPS card.</summary>
    public string? VerdictNote { get; private set; }

    public DateTimeOffset? DecidedAt { get; private set; }

    public static MatchResult ForProblemReport(
        ProblemReport report,
        Innovation innovation,
        int position,
        int score,
        string justification,
        IReadOnlyList<string> citedFields,
        string? adaptation,
        DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(report);
        ArgumentNullException.ThrowIfNull(innovation);
        ArgumentNullException.ThrowIfNull(citedFields);
        EnsurePosition(position);

        if (score is < MinScore or > MaxScore)
        {
            throw new InvalidOperationException($"A match score is between {MinScore} and {MaxScore}, not {score}.");
        }

        return new MatchResult
        {
            Id = Guid.CreateVersion7(),
            ProblemReportId = report.Id,
            Kind = MatchKind.MATCH,
            Position = position,
            Score = score,
            // The id only: candidates are read without tracking, and a navigation would make EF insert them again.
            InnovationId = innovation.Id,
            Justification = EnsureText(justification),
            CitedFields = [.. citedFields],
            Adaptation = string.IsNullOrWhiteSpace(adaptation) ? null : adaptation.Trim(),
            CreatedAt = createdAt,
        };
    }

    public static MatchResult HybridForProblemReport(
        ProblemReport report,
        string name,
        string description,
        IReadOnlyList<Innovation> sources,
        string whyTogether,
        int position,
        DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(report);
        ArgumentNullException.ThrowIfNull(sources);
        EnsurePosition(position);

        List<Guid> sourceIds = [.. sources.Select(source => source.Id).Distinct()];
        if (sourceIds.Count is < MinHybridSources or > MaxHybridSources)
        {
            throw new InvalidOperationException(
                $"A hybrid joins {MinHybridSources} to {MaxHybridSources} innovations, not {sourceIds.Count}.");
        }

        return new MatchResult
        {
            Id = Guid.CreateVersion7(),
            ProblemReportId = report.Id,
            Kind = MatchKind.HYBRID,
            Position = position,
            HybridName = EnsureText(name),
            HybridDescription = EnsureText(description),
            Justification = EnsureText(whyTogether),
            SourceInnovationIds = sourceIds,
            CreatedAt = createdAt,
        };
    }

    /// <summary>"Czy to spełnia Twoją potrzebę?" under a matched innovation — a signal of how well matching hit.</summary>
    public void Decide(Verdict verdict, string? note, DateTimeOffset decidedAt)
    {
        if (Kind != MatchKind.MATCH)
        {
            throw new InvalidOperationException($"Match {Id} is a hybrid; verdicts are given on innovations.");
        }

        VerdictNote = ProblemReport.CheckVerdictNote(verdict, note);
        Verdict = verdict;
        DecidedAt = decidedAt;
    }

    private static void EnsurePosition(int position)
    {
        if (position < 1)
        {
            throw new InvalidOperationException($"A match position starts at 1, not {position}.");
        }
    }

    private static string EnsureText(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException("A match needs its text; the matching pipeline must not pass a blank one.");
        }

        return text.Trim();
    }
}
