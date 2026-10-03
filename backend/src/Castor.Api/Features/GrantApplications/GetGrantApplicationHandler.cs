using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.GrantApplications;

/// <summary>An application for the authors of its idea and for administrators.</summary>
public sealed class GetGrantApplicationHandler(CastorDbContext db, CurrentUser currentUser)
{
    public async Task<GrantApplicationResponse> HandleAsync(Guid grantApplicationId, CancellationToken cancellationToken)
    {
        Guid userId = currentUser.UserId;
        GrantApplication application = await db.GrantApplications
                .AsNoTracking()
                .SingleOrDefaultAsync(candidate => candidate.Id == grantApplicationId, cancellationToken)
            ?? throw new DomainException("The application does not exist.", StatusCodes.Status404NotFound);

        Idea idea = await db.Ideas
            .AsNoTracking()
            .Include(candidate => candidate.CoAuthors)
            .SingleAsync(candidate => candidate.Id == application.IdeaId, cancellationToken);
        if (!idea.IsAuthoredBy(userId) && !currentUser.IsAdmin)
        {
            throw new DomainException("The application does not exist.", StatusCodes.Status404NotFound);
        }

        GrantCall grantCall = await db.GrantCalls
            .AsNoTracking()
            .SingleAsync(candidate => candidate.Id == application.GrantCallId, cancellationToken);

        return application.ToResponse(idea, grantCall, userId);
    }
}
