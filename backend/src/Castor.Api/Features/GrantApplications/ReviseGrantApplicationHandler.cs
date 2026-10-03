using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.GrantApplications;

/// <summary>The authors of the idea edit the application; the criteria stay as the call had them when it was generated.</summary>
public sealed class ReviseGrantApplicationHandler(CastorDbContext db, CurrentUser currentUser, IClock clock)
{
    public async Task<GrantApplicationResponse> HandleAsync(
        Guid grantApplicationId,
        ReviseGrantApplicationRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Guid userId = currentUser.UserId;
        GrantApplication application = await db.GrantApplications
                .SingleOrDefaultAsync(candidate => candidate.Id == grantApplicationId, cancellationToken)
            ?? throw new DomainException("The application does not exist.", StatusCodes.Status404NotFound);

        Idea idea = await db.Ideas
            .AsNoTracking()
            .Include(candidate => candidate.CoAuthors)
            .SingleAsync(candidate => candidate.Id == application.IdeaId, cancellationToken);

        application.Revise(idea, userId, request.Title, request.Summary, request.Answers ?? [], clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        GrantCall grantCall = await db.GrantCalls
            .AsNoTracking()
            .SingleAsync(candidate => candidate.Id == application.GrantCallId, cancellationToken);

        return application.ToResponse(idea, grantCall, userId);
    }
}
