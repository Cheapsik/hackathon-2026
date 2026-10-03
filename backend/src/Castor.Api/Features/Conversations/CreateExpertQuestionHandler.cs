using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Conversations;

/// <summary>"Zapytaj eksperta": a signed-in user asks the experts of one challenge area; any of them may answer.</summary>
public sealed class CreateExpertQuestionHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    IHubContext<LiveHub> hub,
    IClock clock)
{
    public async Task<ConversationResponse> HandleAsync(CreateExpertQuestionRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Guid userId = currentUser.UserId;
        string areaCode = request.ChallengeAreaCode?.Trim() ?? string.Empty;
        ChallengeArea area = await db.ChallengeAreas.SingleOrDefaultAsync(candidate => candidate.Code == areaCode, cancellationToken)
            ?? throw new DomainException("Choose one of the challenge areas.");

        DateTimeOffset now = clock.UtcNow;
        var conversation = Conversation.AskExperts(userId, area, request.Subject, now);
        Message message = conversation.Post(SenderRole.INITIATOR, userId, request.Text, now);
        db.Conversations.Add(conversation);
        db.Messages.Add(message);
        await db.SaveChangesAsync(cancellationToken);

        IReadOnlyList<string> groups = LiveHub.ConversationGroups(conversation);
        MessagePostedEvent posted = message.ToPostedEvent();
        await hub.Clients.Groups(groups).SendAsync(LiveEvents.MessagePosted, posted, cancellationToken);

        return conversation.ToResponse([message], userId, SenderRole.INITIATOR);
    }
}
