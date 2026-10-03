using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>
/// "Pomysły innych": submitted and accepted ideas, newest first, so a user can join one instead of writing it again.
/// </summary>
public sealed class ListSubmittedIdeasHandler(CastorDbContext db, CurrentUser currentUser)
{
    private const int Limit = 200;

    public async Task<IReadOnlyList<IdeaSummaryResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        Guid userId = currentUser.UserId;
        List<Idea> ideas = await db.Ideas
            .AsNoTracking()
            .Include(idea => idea.CoAuthors)
            .Where(idea => idea.Status == IdeaStatus.SUBMITTED || idea.Status == IdeaStatus.ACCEPTED)
            .OrderByDescending(idea => idea.SubmittedAt)
            .Take(Limit)
            .ToListAsync(cancellationToken);

        List<Guid> ideaIds = [.. ideas.Select(idea => idea.Id)];
        List<Guid> reviewedIds = await db.IdeaReviews
            .Where(review => review.ExpertId == userId && ideaIds.Contains(review.IdeaId))
            .Select(review => review.IdeaId)
            .ToListAsync(cancellationToken);
        HashSet<Guid> reviewed = [.. reviewedIds];

        return [.. ideas.Select(idea => idea.ToSummaryResponse(userId, reviewed))];
    }
}
