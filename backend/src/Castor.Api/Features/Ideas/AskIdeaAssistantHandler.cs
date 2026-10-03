using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>A message to the Kreator's assistant; each author has their own chat next to the card.</summary>
public sealed class AskIdeaAssistantHandler(CastorDbContext db, CurrentUser currentUser, IdeaAssistant assistant, IClock clock)
{
    /// <returns>The user's whole chat with the assistant of this idea, oldest first.</returns>
    public async Task<IReadOnlyList<IdeaAssistantMessageResponse>> HandleAsync(
        Guid ideaId,
        AskIdeaAssistantRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Guid userId = currentUser.UserId;
        Idea? idea = await db.Ideas
            .AsNoTracking()
            .Include(candidate => candidate.CoAuthors)
            .SingleOrDefaultAsync(candidate => candidate.Id == ideaId, cancellationToken);

        if (idea is null || !idea.IsAuthoredBy(userId))
        {
            throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);
        }

        List<IdeaAssistantMessage> history = await db.IdeaAssistantMessages
            .Where(message => message.IdeaId == idea.Id && message.UserId == userId)
            .OrderBy(message => message.CreatedAt)
            .ToListAsync(cancellationToken);

        var question = IdeaAssistantMessage.FromUser(idea, userId, request.Message, clock.UtcNow);
        string reply = await assistant.ReplyAsync(idea, history, question, cancellationToken);
        var answer = IdeaAssistantMessage.FromAssistant(idea, userId, reply, clock.UtcNow);

        db.IdeaAssistantMessages.Add(question);
        db.IdeaAssistantMessages.Add(answer);
        await db.SaveChangesAsync(cancellationToken);

        history.Add(question);
        history.Add(answer);
        return [.. history.Select(message => message.ToResponse())];
    }
}
