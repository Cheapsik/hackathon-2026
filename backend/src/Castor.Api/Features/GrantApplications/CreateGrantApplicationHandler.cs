using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.GrantApplications;

/// <summary>
/// "Generuj wniosek": an author of the idea gets an application for an open grant call, drafted by the language model.
/// An idea applies once per call; asking again returns the stored application instead of drafting a new one.
/// </summary>
public sealed class CreateGrantApplicationHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    GrantApplicationWriter writer,
    IClock clock)
{
    public async Task<GrantApplicationOutcome> HandleAsync(
        Guid ideaId,
        CreateGrantApplicationRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.GrantCallId is not Guid grantCallId)
        {
            throw new DomainException("An application is written for a grant call.");
        }

        Guid userId = currentUser.UserId;
        Idea? idea = await db.Ideas
            .AsNoTracking()
            .Include(candidate => candidate.CoAuthors)
            .SingleOrDefaultAsync(candidate => candidate.Id == ideaId, cancellationToken);
        if (idea is null || !idea.IsAuthoredBy(userId))
        {
            throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);
        }

        GrantCall grantCall = await db.GrantCalls
                .AsNoTracking()
                .SingleOrDefaultAsync(candidate => candidate.Id == grantCallId, cancellationToken)
            ?? throw new DomainException("The grant call does not exist.", StatusCodes.Status404NotFound);

        GrantApplication? stored = await db.GrantApplications
            .AsNoTracking()
            .SingleOrDefaultAsync(application => application.IdeaId == ideaId && application.GrantCallId == grantCallId, cancellationToken);
        if (stored is not null)
        {
            GrantApplicationResponse storedResponse = stored.ToResponse(idea, grantCall, userId);
            return new GrantApplicationOutcome(storedResponse, Created: false);
        }

        if (!grantCall.IsOpen)
        {
            throw new DomainException("The grant call is not open.", StatusCodes.Status409Conflict);
        }

        GrantApplicationDraft draft = await writer.DraftAsync(idea, grantCall, cancellationToken);
        var application = GrantApplication.Draft(idea, grantCall, userId, draft.Title, draft.Summary, draft.Answers, clock.UtcNow);
        db.GrantApplications.Add(application);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (PostgresErrors.IsUniqueViolation(exception))
        {
            throw new DomainException("A co-author generated the application at the same time; open it from the idea.", StatusCodes.Status409Conflict);
        }

        GrantApplicationResponse response = application.ToResponse(idea, grantCall, userId);
        return new GrantApplicationOutcome(response, Created: true);
    }
}
