using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Conversations;

/// <summary>
/// A message from whoever takes part in the conversation. A message from a report's author or code holder after the
/// answer takes the report back to analysis (SPEC 7 V). Everyone in the conversation hears it live.
/// </summary>
public sealed class PostMessageHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    ExpertChallengeAreasQuery expertAreasQuery,
    IHubContext<LiveHub> hub,
    IClock clock)
{
    /// <param name="presentedTrackingCode">The code a visitor holds for a report's thread; others need none.</param>
    public async Task<ConversationResponse> HandleAsync(
        Guid conversationId,
        string? presentedTrackingCode,
        PostMessageRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Guid? userId = currentUser.UserIdOrNull;
        string[] expertAreas = await expertAreasQuery.OfAsync(userId, cancellationToken);
        string? trackingCode = TrackingCode.Normalize(presentedTrackingCode);
        var reader = new ConversationReader(userId, currentUser.IsAdmin, expertAreas, trackingCode);

        Conversation conversation = await db.Conversations
                .Include(candidate => candidate.ProblemReport)
                .Include(candidate => candidate.ChallengeArea)
                .Include(candidate => candidate.Innovation)
                .SingleOrDefaultAsync(candidate => candidate.Id == conversationId, cancellationToken)
            ?? throw new DomainException("The conversation does not exist.", StatusCodes.Status404NotFound);

        SenderRole senderRole = conversation.SenderRoleOf(reader)
            ?? throw new DomainException("The conversation does not exist.", StatusCodes.Status404NotFound);

        DateTimeOffset now = clock.UtcNow;
        ProblemReport? report = conversation.ProblemReport;
        ProblemReportStatus? statusBefore = report?.Status;

        Message message = conversation.Post(senderRole, userId, request.Text, now);
        db.Messages.Add(message);
        if (report is not null && senderRole == SenderRole.INITIATOR)
        {
            report.ReopenAfterAuthorMessage(now);
        }

        await db.SaveChangesAsync(cancellationToken);

        await AnnounceAsync(conversation, message, statusBefore, cancellationToken);

        List<Message> messages = await db.Messages
            .AsNoTracking()
            .Where(candidate => candidate.ConversationId == conversation.Id)
            .OrderBy(candidate => candidate.PostedAt)
            .ToListAsync(cancellationToken);

        return conversation.ToResponse(messages, userId, senderRole);
    }

    private async Task AnnounceAsync(
        Conversation conversation,
        Message message,
        ProblemReportStatus? statusBefore,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<string> groups = LiveHub.ConversationGroups(conversation);
        MessagePostedEvent posted = message.ToPostedEvent();
        await hub.Clients.Groups(groups).SendAsync(LiveEvents.MessagePosted, posted, cancellationToken);

        ProblemReport? report = conversation.ProblemReport;
        if (report is not null && report.Status != statusBefore)
        {
            string status = report.Status.ToString();
            var changed = new ProblemReportStatusChangedEvent(report.Id, status, report.UpdatedAt);
            await hub.Clients.Groups(groups).SendAsync(LiveEvents.ProblemReportStatusChanged, changed, cancellationToken);
        }
    }
}
