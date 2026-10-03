using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>The signed-in author's chat with the assistant of an idea, oldest first.</summary>
public sealed class ListIdeaAssistantMessagesHandler(CastorDbContext db, CurrentUser currentUser)
{
    public async Task<IReadOnlyList<IdeaAssistantMessageResponse>> HandleAsync(Guid ideaId, CancellationToken cancellationToken)
    {
        Guid userId = currentUser.UserId;
        Idea? idea = await db.Ideas
            .AsNoTracking()
            .Include(candidate => candidate.CoAuthors)
            .SingleOrDefaultAsync(candidate => candidate.Id == ideaId, cancellationToken);

        if (idea is null || !idea.IsAuthoredBy(userId))
        {
            throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);
        }

        List<IdeaAssistantMessage> messages = await db.IdeaAssistantMessages
            .AsNoTracking()
            .Where(message => message.IdeaId == ideaId && message.UserId == userId)
            .OrderBy(message => message.CreatedAt)
            .ToListAsync(cancellationToken);

        return [.. messages.Select(message => message.ToResponse())];
    }
}
