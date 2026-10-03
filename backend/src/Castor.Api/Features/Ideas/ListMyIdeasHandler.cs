using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>The ideas the signed-in user wrote or joined, most recently changed first.</summary>
public sealed class ListMyIdeasHandler(CastorDbContext db, CurrentUser currentUser)
{
    private const int Limit = 200;

    public async Task<IReadOnlyList<IdeaSummaryResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        Guid userId = currentUser.UserId;
        List<Idea> ideas = await db.Ideas
            .AsNoTracking()
            .Include(idea => idea.CoAuthors)
            .Where(idea => idea.AuthorId == userId || idea.CoAuthors.Any(coAuthor => coAuthor.UserId == userId))
            .OrderByDescending(idea => idea.UpdatedAt)
            .Take(Limit)
            .ToListAsync(cancellationToken);

        HashSet<Guid> reviewed = [];
        return [.. ideas.Select(idea => idea.ToSummaryResponse(userId, reviewed))];
    }
}
