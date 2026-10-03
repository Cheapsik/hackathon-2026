using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Conversations;

/// <summary>One conversation with its messages, for whoever takes part in it — a report's thread also by its code.</summary>
public sealed class GetConversationHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    ExpertChallengeAreasQuery expertAreasQuery)
{
    /// <param name="presentedTrackingCode">The code a visitor holds for a report's thread; others need none.</param>
    public async Task<ConversationResponse> HandleAsync(
        Guid conversationId,
        string? presentedTrackingCode,
        CancellationToken cancellationToken)
    {
        Guid? userId = currentUser.UserIdOrNull;
        string[] expertAreas = await expertAreasQuery.OfAsync(userId, cancellationToken);
        string? trackingCode = TrackingCode.Normalize(presentedTrackingCode);
        var reader = new ConversationReader(userId, currentUser.IsAdmin, expertAreas, trackingCode);

        Conversation conversation = await db.Conversations
                .AsNoTracking()
                .Include(candidate => candidate.ProblemReport)
                .Include(candidate => candidate.ChallengeArea)
                .Include(candidate => candidate.Innovation!)
                .ThenInclude(innovation => innovation.SourceIdea!)
                .ThenInclude(idea => idea.CoAuthors)
                .SingleOrDefaultAsync(candidate => candidate.Id == conversationId, cancellationToken)
            ?? throw new DomainException("The conversation does not exist.", StatusCodes.Status404NotFound);

        SenderRole senderRole = conversation.SenderRoleOf(reader)
            ?? throw new DomainException("The conversation does not exist.", StatusCodes.Status404NotFound);

        List<Message> messages = await db.Messages
            .AsNoTracking()
            .Where(message => message.ConversationId == conversation.Id)
            .OrderBy(message => message.PostedAt)
            .ToListAsync(cancellationToken);

        return conversation.ToResponse(messages, userId, senderRole);
    }
}
