using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>An administrator moves a report forward or closes it; everyone who may see the report hears it live.</summary>
public sealed class MoveProblemReportHandler(
    CastorDbContext db,
    ProblemReportViewQuery viewQuery,
    SuggestedExpertsQuery expertsQuery,
    IHubContext<LiveHub> hub,
    IClock clock)
{
    public async Task<InboxProblemReportResponse> HandleAsync(
        Guid problemReportId,
        MoveProblemReportRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!NamedEnum.TryParse(request.Status, out ProblemReportStatus status))
        {
            throw new DomainException("Status is RECEIVED, IN_ANALYSIS, WITH_EXPERT, ANSWERED or CLOSED.");
        }

        ProblemReport report = await db.ProblemReports
                .Include(candidate => candidate.Municipality)
                .SingleOrDefaultAsync(candidate => candidate.Id == problemReportId, cancellationToken)
            ?? throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);

        report.MoveByAdmin(status, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        string statusText = report.Status.ToString();
        var changed = new ProblemReportStatusChangedEvent(report.Id, statusText, report.UpdatedAt);
        IReadOnlyList<string> groups = LiveHub.ProblemReportGroups(report);
        await hub.Clients.Groups(groups).SendAsync(LiveEvents.ProblemReportStatusChanged, changed, cancellationToken);

        ProblemReportView view = await viewQuery.OfAsync(report, cancellationToken);
        IReadOnlyList<SuggestedExpert> experts = await expertsQuery.ForAsync(report, cancellationToken);
        return report.ToInboxResponse(view, experts);
    }
}
