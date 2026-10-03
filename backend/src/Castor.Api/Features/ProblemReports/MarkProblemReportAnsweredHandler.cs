using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>An expert of the report's areas moves it from "with an expert" to "answered"; everyone who may see it hears it.</summary>
public sealed class MarkProblemReportAnsweredHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    IHubContext<LiveHub> hub,
    IClock clock)
{
    public async Task<ProblemReportSummaryResponse> HandleAsync(Guid problemReportId, CancellationToken cancellationToken)
    {
        Guid userId = currentUser.UserId;
        User expert = await db.Users.AsNoTracking().SingleOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken)
            ?? throw new DomainException("The request is not signed in.", StatusCodes.Status401Unauthorized);

        ProblemReport report = await db.ProblemReports.SingleOrDefaultAsync(candidate => candidate.Id == problemReportId, cancellationToken)
            ?? throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);

        report.MarkAnsweredBy(expert, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        string status = report.Status.ToString();
        var changed = new ProblemReportStatusChangedEvent(report.Id, status, report.UpdatedAt);
        IReadOnlyList<string> groups = LiveHub.ProblemReportGroups(report);
        await hub.Clients.Groups(groups).SendAsync(LiveEvents.ProblemReportStatusChanged, changed, cancellationToken);

        return report.ToSummaryResponse();
    }
}
