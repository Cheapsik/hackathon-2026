using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>Opens a report in the inbox; like the author's view, it first matches a report whose matching did not finish.</summary>
public sealed class GetInboxProblemReportHandler(
    CastorDbContext db,
    ProblemReportMatching matching,
    ProblemReportViewQuery viewQuery,
    SuggestedExpertsQuery expertsQuery)
{
    public async Task<InboxProblemReportResponse> HandleAsync(Guid problemReportId, CancellationToken cancellationToken)
    {
        ProblemReport report = await db.ProblemReports
                .Include(candidate => candidate.Municipality)
                .SingleOrDefaultAsync(candidate => candidate.Id == problemReportId, cancellationToken)
            ?? throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);

        if (report.AwaitsMatching)
        {
            await matching.CompleteAsync(report, cancellationToken);
        }

        ProblemReportView view = await viewQuery.OfAsync(report, cancellationToken);
        IReadOnlyList<SuggestedExpert> experts = await expertsQuery.ForAsync(report, cancellationToken);

        return report.ToInboxResponse(view, experts);
    }
}
