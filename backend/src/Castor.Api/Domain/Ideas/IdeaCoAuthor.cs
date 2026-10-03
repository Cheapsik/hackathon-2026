namespace Castor.Api.Domain;

/// <summary>A user who joined someone else's idea instead of submitting a similar one (SPEC 7 III).</summary>
public sealed class IdeaCoAuthor
{
    private IdeaCoAuthor()
    {
    }

    public Guid IdeaId { get; private set; }

    public Guid UserId { get; private set; }

    public DateTimeOffset JoinedAt { get; private set; }

    internal static IdeaCoAuthor Join(Idea idea, Guid userId, DateTimeOffset joinedAt)
    {
        ArgumentNullException.ThrowIfNull(idea);

        if (userId == Guid.Empty)
        {
            throw new InvalidOperationException("A co-author needs the id of the user who joins.");
        }

        return new IdeaCoAuthor
        {
            IdeaId = idea.Id,
            UserId = userId,
            JoinedAt = joinedAt,
        };
    }
}
