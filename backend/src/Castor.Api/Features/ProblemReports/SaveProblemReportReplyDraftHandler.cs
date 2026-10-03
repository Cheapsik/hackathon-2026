using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>The administrator's edited reply draft.</summary>
public sealed class SaveProblemReportReplyDraftHandler(
    CastorDbContext db,
    ProblemReportViewQuery viewQuery,
    SuggestedExpertsQuery expertsQuery,
    IClock clock)
{
    public async Task<InboxProblemReportResponse> HandleAsync(
        Guid problemReportId,
        SaveProblemReportReplyDraftRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        ProblemReport report = await db.ProblemReports
                .Include(candidate => candidate.Municipality)
                .SingleOrDefaultAsync(candidate => candidate.Id == problemReportId, cancellationToken)
            ?? throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);

        report.SaveReplyDraft(request.Text, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        ProblemReportView view = await viewQuery.OfAsync(report, cancellationToken);
        IReadOnlyList<SuggestedExpert> experts = await expertsQuery.ForAsync(report, cancellationToken);
        return report.ToInboxResponse(view, experts);
    }
}
