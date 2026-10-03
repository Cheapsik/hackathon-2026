namespace Castor.Api.Domain;

/// <summary>
/// An expert's recommendation for a submitted idea of their areas, with a comment (SPEC 7 III). One per expert and
/// idea; the expert may change it while the idea waits for a decision. Its authors and administrators read it without
/// the expert's name.
/// </summary>
public sealed class IdeaReview
{
    public const int CommentMaxLength = 2000;

    private IdeaReview()
    {
    }

    public Guid Id { get; private set; }

    public Guid IdeaId { get; private set; }

    public Guid ExpertId { get; private set; }

    public IdeaReviewRecommendation Recommendation { get; private set; }

    public string Comment { get; private set; } = null!;

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    /// <param name="expertAreaCodes">The expert's challenge areas; empty for a user who is not an expert.</param>
    public static IdeaReview Write(
        Idea idea,
        Guid expertId,
        IReadOnlyCollection<string> expertAreaCodes,
        IdeaReviewRecommendation recommendation,
        string? comment,
        DateTimeOffset writtenAt)
    {
        ArgumentNullException.ThrowIfNull(idea);

        if (expertId == Guid.Empty)
        {
            throw new InvalidOperationException("The expert of a new review has an empty id.");
        }

        EnsureReviewable(idea, expertAreaCodes);
        return new IdeaReview
        {
            Id = Guid.CreateVersion7(),
            IdeaId = idea.Id,
            ExpertId = expertId,
            Recommendation = recommendation,
            Comment = EnsureComment(comment),
            CreatedAt = writtenAt,
            UpdatedAt = writtenAt,
        };
    }

    public void Revise(
        Idea idea,
        IReadOnlyCollection<string> expertAreaCodes,
        IdeaReviewRecommendation recommendation,
        string? comment,
        DateTimeOffset changedAt)
    {
        ArgumentNullException.ThrowIfNull(idea);

        if (idea.Id != IdeaId)
        {
            throw new InvalidOperationException($"Review {Id} belongs to another idea.");
        }

        EnsureReviewable(idea, expertAreaCodes);
        Recommendation = recommendation;
        Comment = EnsureComment(comment);
        UpdatedAt = changedAt;
    }

    private static void EnsureReviewable(Idea idea, IReadOnlyCollection<string> expertAreaCodes)
    {
        if (!idea.IsInAreasOf(expertAreaCodes))
        {
            throw new DomainException("Only an expert of the idea's challenge areas reviews it.", StatusCodes.Status403Forbidden);
        }

        if (!idea.IsReviewableBy(expertAreaCodes))
        {
            throw new DomainException("Only a submitted idea waiting for a decision is reviewed.", StatusCodes.Status409Conflict);
        }
    }

    private static string EnsureComment(string? comment)
    {
        string trimmed = comment?.Trim() ?? string.Empty;
        if (trimmed.Length == 0)
        {
            throw new DomainException("A review needs a comment.");
        }

        if (trimmed.Length > CommentMaxLength)
        {
            throw new DomainException($"A review comment has at most {CommentMaxLength} characters.");
        }

        return trimmed;
    }
}
