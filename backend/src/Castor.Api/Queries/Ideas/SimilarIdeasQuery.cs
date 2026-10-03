using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Queries;

/// <summary>
/// Submitted and accepted ideas the duplicate check may name: those sharing a challenge area with the idea, newest
/// first. Drafts are private and rejected ideas take no co-authors, so neither is offered.
/// </summary>
public sealed class SimilarIdeasQuery(CastorDbContext db)
{
    public async Task<List<Idea>> FindAsync(Idea idea, int limit, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(idea);

        Guid ideaId = idea.Id;
        List<string> areas = idea.ChallengeAreaCodes;

        return await db.Ideas
            .AsNoTracking()
            .Where(candidate => candidate.Id != ideaId
                && (candidate.Status == IdeaStatus.SUBMITTED || candidate.Status == IdeaStatus.ACCEPTED))
            .Where(candidate => areas.Count == 0 || candidate.ChallengeAreaCodes.Any(code => areas.Contains(code)))
            .OrderByDescending(candidate => candidate.SubmittedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }
}
