using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>
/// "Opisz problem": the report is stored with its thread and announced to administrators first, then classified;
/// without clarifying questions it is matched at once. Only the anonymized description reaches the language model.
/// When the model fails, the author still gets the stored report with its tracking code.
/// </summary>
public sealed class CreateProblemReportHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    ProblemReportMatching matching,
    ProblemReportViewQuery viewQuery,
    IHubContext<LiveHub> hub,
    IClock clock)
{
    public async Task<ProblemReportResponse> HandleAsync(CreateProblemReportRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Municipality? municipality = await FindMunicipalityAsync(request.MunicipalityTeryt, cancellationToken);
        Guid? authorId = currentUser.UserIdOrNull;
        string trackingCode = TrackingCode.Generate();

        // A collision of two random 40-bit codes is not handled: the unique index refuses it as a 500.
        var report = ProblemReport.Submit(
            request.Description,
            municipality,
            request.SubmittedOnBehalf,
            request.Dictated,
            request.KeepOriginalDescription,
            authorId,
            trackingCode,
            clock.UtcNow);
        db.ProblemReports.Add(report);
        var conversation = Conversation.ForProblemReport(report, report.CreatedAt);
        db.Conversations.Add(conversation);
        await db.SaveChangesAsync(cancellationToken);

        ProblemReportCreatedEvent created = report.ToCreatedEvent();
        await hub.Clients.Group(LiveHub.AdminsGroup).SendAsync(LiveEvents.ProblemReportCreated, created, cancellationToken);

        await matching.CompleteAsync(report, cancellationToken);

        ProblemReportView view = await viewQuery.OfAsync(report, cancellationToken);
        bool showOriginal = report.ShowsOriginalTo(authorId, currentUser.IsAdmin);
        return report.ToResponse(view, showOriginal);
    }

    private async Task<Municipality?> FindMunicipalityAsync(string? teryt, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(teryt))
        {
            return null;
        }

        string trimmed = teryt.Trim();
        return await db.Municipalities.SingleOrDefaultAsync(candidate => candidate.Teryt == trimmed, cancellationToken)
            ?? throw new DomainException("The municipality does not exist.");
    }
}
