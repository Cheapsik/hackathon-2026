using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>"Do oceny": submitted ideas of the expert's areas waiting for a decision, oldest first.</summary>
public sealed class ListIdeasForReviewHandler(CastorDbContext db, IdeaReaderFactory readers)
{
    private const int Limit = 200;

    public async Task<IReadOnlyList<IdeaSummaryResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        IdeaReader reader = await readers.CurrentAsync(cancellationToken);
        IReadOnlyList<string> areas = reader.ExpertChallengeAreaCodes;
        if (areas.Count == 0)
        {
            return [];
        }

        List<Idea> ideas = await db.Ideas
            .AsNoTracking()
            .Include(idea => idea.CoAuthors)
            .Where(idea => idea.Status == IdeaStatus.SUBMITTED && idea.ChallengeAreaCodes.Any(code => areas.Contains(code)))
            .OrderBy(idea => idea.SubmittedAt)
            .Take(Limit)
            .ToListAsync(cancellationToken);

        Guid userId = reader.UserId;
        List<Guid> ideaIds = [.. ideas.Select(idea => idea.Id)];
        List<Guid> reviewedIds = await db.IdeaReviews
            .Where(review => review.ExpertId == userId && ideaIds.Contains(review.IdeaId))
            .Select(review => review.IdeaId)
            .ToListAsync(cancellationToken);
        HashSet<Guid> reviewed = [.. reviewedIds];

        return [.. ideas.Select(idea => idea.ToSummaryResponse(userId, reviewed))];
    }
}
