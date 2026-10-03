using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Feedback;

/// <summary>Who may read feedback summaries and toggle "szukam testerów" on a user innovation.</summary>
public static class InnovationTeamAccess
{
    public static async Task<bool> CanManageAsync(CastorDbContext db, Innovation innovation, Guid userId, bool isAdmin, CancellationToken cancellationToken)
    {
        if (isAdmin)
        {
            return true;
        }

        if (innovation.SourceIdeaId is null)
        {
            return false;
        }

        Idea? idea = await db.Ideas.AsNoTracking()
            .Include(candidate => candidate.CoAuthors)
            .SingleOrDefaultAsync(candidate => candidate.Id == innovation.SourceIdeaId, cancellationToken);

        return idea is not null && idea.IsAuthoredBy(userId);
    }
}
