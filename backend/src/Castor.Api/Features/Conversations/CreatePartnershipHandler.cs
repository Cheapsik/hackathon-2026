using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Conversations;

/// <summary>
/// "Napisz do zespołu innowacji": the organizations behind library innovations have no accounts, so administrators
/// receive the proposal and mediate (SPEC 7 V).
/// </summary>
public sealed class CreatePartnershipHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    IHubContext<LiveHub> hub,
    IClock clock)
{
    public async Task<ConversationResponse> HandleAsync(CreatePartnershipRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Guid userId = currentUser.UserId;
        if (request.InnovationId is not Guid innovationId)
        {
            throw new DomainException("A partnership is about an innovation.");
        }

        Innovation innovation = await db.Innovations.SingleOrDefaultAsync(candidate => candidate.Id == innovationId, cancellationToken)
            ?? throw new DomainException("The innovation does not exist.", StatusCodes.Status404NotFound);

        DateTimeOffset now = clock.UtcNow;
        var conversation = Conversation.ProposePartnership(userId, innovation, request.Subject, now);
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
