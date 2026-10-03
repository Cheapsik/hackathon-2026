using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.GrantApplications;

/// <summary>The applications for one grant call, for ROPS, most recently changed first.</summary>
public sealed class ListGrantCallApplicationsHandler(CastorDbContext db)
{
    public async Task<IReadOnlyList<GrantApplicationSummaryResponse>> HandleAsync(Guid grantCallId, CancellationToken cancellationToken)
    {
        bool exists = await db.GrantCalls.AnyAsync(grantCall => grantCall.Id == grantCallId, cancellationToken);
        if (!exists)
        {
            throw new DomainException("The grant call does not exist.", StatusCodes.Status404NotFound);
        }

        List<GrantApplication> applications = await db.GrantApplications
            .AsNoTracking()
            .Where(application => application.GrantCallId == grantCallId)
            .OrderByDescending(application => application.UpdatedAt)
            .ToListAsync(cancellationToken);

        List<Guid> ideaIds = [.. applications.Select(application => application.IdeaId)];
        Dictionary<Guid, string> ideaTitles = await db.Ideas
            .Where(idea => ideaIds.Contains(idea.Id))
            .ToDictionaryAsync(idea => idea.Id, idea => idea.Title, cancellationToken);

        return [.. applications.Select(application => application.ToSummaryResponse(ideaTitles[application.IdeaId]))];
    }
}
