using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>"Pomysły" of the administrator's panel: submitted ideas first by date; drafts stay with their authors.</summary>
public sealed class ListAdminIdeasHandler(CastorDbContext db, CurrentUser currentUser)
{
    private const int Limit = 500;

    public async Task<IReadOnlyList<IdeaSummaryResponse>> HandleAsync(ListAdminIdeasRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        IQueryable<Idea> ideas = db.Ideas
            .AsNoTracking()
            .Include(idea => idea.CoAuthors)
            .Where(idea => idea.Status != IdeaStatus.DRAFT);

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (!NamedEnum.TryParse(request.Status, out IdeaStatus status) || status == IdeaStatus.DRAFT)
            {
                throw new DomainException("Status is SUBMITTED, ACCEPTED or REJECTED.");
            }

            ideas = ideas.Where(idea => idea.Status == status);
        }

        List<Idea> found = await ideas
            .OrderByDescending(idea => idea.SubmittedAt)
            .Take(Limit)
            .ToListAsync(cancellationToken);

        Guid userId = currentUser.UserId;
        HashSet<Guid> reviewed = [];
        return [.. found.Select(idea => idea.ToSummaryResponse(userId, reviewed))];
    }
}
