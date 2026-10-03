namespace Castor.Api.Domain;

/// <summary>
/// One result of the duplicate check (SPEC 6.6): a similar innovation or idea, with the title it had when checked,
/// so the list keeps reading the same after the other card changes.
/// </summary>
public sealed class IdeaSimilarity
{
    private IdeaSimilarity()
    {
    }

    public IdeaSimilarityKind Kind { get; private set; }

    public Guid TargetId { get; private set; }

    public string Title { get; private set; } = null!;

    /// <summary>0–100.</summary>
    public int Score { get; private set; }

    public string Justification { get; private set; } = null!;

    public static IdeaSimilarity Of(IdeaSimilarityKind kind, Guid targetId, string title, int score, string justification)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(justification);

        if (targetId == Guid.Empty)
        {
            throw new InvalidOperationException("A similar card needs its id.");
        }

        if (score is < MatchResult.MinScore or > MatchResult.MaxScore)
        {
            throw new InvalidOperationException($"A similarity score is between {MatchResult.MinScore} and {MatchResult.MaxScore}, not {score}.");
        }

        return new IdeaSimilarity
        {
            Kind = kind,
            TargetId = targetId,
            Title = title,
            Score = score,
            Justification = justification.Trim(),
        };
    }
}
