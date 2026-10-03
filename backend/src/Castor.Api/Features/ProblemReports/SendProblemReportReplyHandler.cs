using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>
/// The administrator sends the reply draft: it is posted in the report's thread and the report counts as answered.
/// Everyone in the thread hears both.
/// </summary>
public sealed class SendProblemReportReplyHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    ProblemReportViewQuery viewQuery,
    SuggestedExpertsQuery expertsQuery,
    IHubContext<LiveHub> hub,
    IClock clock)
{
    public async Task<InboxProblemReportResponse> HandleAsync(Guid problemReportId, CancellationToken cancellationToken)
    {
        Guid adminId = currentUser.UserId;
        Conversation conversation = await db.Conversations
                .Include(candidate => candidate.ProblemReport!)
                .ThenInclude(report => report.Municipality)
                .SingleOrDefaultAsync(candidate => candidate.ProblemReportId == problemReportId, cancellationToken)
            ?? throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);
        ProblemReport report = conversation.ProblemReport
            ?? throw new InvalidOperationException($"Conversation {conversation.Id} was loaded without its problem report.");

        DateTimeOffset now = clock.UtcNow;
        ProblemReportStatus statusBefore = report.Status;
        string reply = report.SendReplyDraft(now);
        Message message = conversation.Post(SenderRole.ADMIN, adminId, reply, now);
        db.Messages.Add(message);
        await db.SaveChangesAsync(cancellationToken);

        await AnnounceAsync(report, message, statusBefore, cancellationToken);

        ProblemReportView view = await viewQuery.OfAsync(report, cancellationToken);
        IReadOnlyList<SuggestedExpert> experts = await expertsQuery.ForAsync(report, cancellationToken);
        return report.ToInboxResponse(view, experts);
    }

    private async Task AnnounceAsync(
        ProblemReport report,
        Message message,
        ProblemReportStatus statusBefore,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<string> groups = LiveHub.ProblemReportGroups(report);
        string senderRole = message.SenderRole.ToString();
        var posted = new MessagePostedEvent(message.ConversationId, message.Id, senderRole, message.PostedAt);
        await hub.Clients.Groups(groups).SendAsync(LiveEvents.MessagePosted, posted, cancellationToken);

        if (report.Status != statusBefore)
        {
            string status = report.Status.ToString();
            var changed = new ProblemReportStatusChangedEvent(report.Id, status, report.UpdatedAt);
            await hub.Clients.Groups(groups).SendAsync(LiveEvents.ProblemReportStatusChanged, changed, cancellationToken);
        }
    }
}
