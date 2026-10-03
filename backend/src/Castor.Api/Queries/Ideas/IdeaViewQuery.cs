using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Queries;

/// <summary>Everything every handler returning an idea shows with it, read in a few small queries.</summary>
public sealed class IdeaViewQuery(CastorDbContext db)
{
    public async Task<IdeaView> OfAsync(Idea idea, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(idea);

        List<string> areaCodes = idea.ChallengeAreaCodes;
        List<ChallengeArea> areas = await db.ChallengeAreas
            .AsNoTracking()
            .Where(area => areaCodes.Contains(area.Code))
            .ToListAsync(cancellationToken);
        List<ChallengeArea> orderedAreas = [.. areas.OrderBy(area => areaCodes.IndexOf(area.Code))];

        List<Guid> innovationIds = [.. idea.FromHybridOf];
        if (idea.StartingInnovationId is Guid startingId)
        {
            innovationIds.Add(startingId);
        }

        Dictionary<Guid, string> titles = await db.Innovations
            .AsNoTracking()
            .Where(innovation => innovationIds.Contains(innovation.Id))
            .ToDictionaryAsync(innovation => innovation.Id, innovation => innovation.Title, cancellationToken);

        Guid ideaId = idea.Id;
        List<IdeaReview> reviews = await db.IdeaReviews
            .AsNoTracking()
            .Where(review => review.IdeaId == ideaId)
            .OrderBy(review => review.CreatedAt)
            .ToListAsync(cancellationToken);

        List<Guid> grown = await db.Innovations
            .Where(innovation => innovation.SourceIdeaId == ideaId)
            .Select(innovation => innovation.Id)
            .ToListAsync(cancellationToken);
        Guid? innovationId = grown.Count == 0 ? null : grown[0];

        List<IdeaGrantApplicationView> applications = await db.GrantApplications
            .AsNoTracking()
            .Where(application => application.IdeaId == ideaId)
            .Join(
                db.GrantCalls,
                application => application.GrantCallId,
                grantCall => grantCall.Id,
                (application, grantCall) => new IdeaGrantApplicationView(application.Id, grantCall.Id, grantCall.Title))
            .ToListAsync(cancellationToken);

        return new IdeaView(orderedAreas, titles, reviews, innovationId, applications);
    }
}
