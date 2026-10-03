using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

public sealed class GetInboxProblemReportHandler(
    CastorDbContext db,
    ProblemReportViewQuery viewQuery,
    SuggestedExpertsQuery expertsQuery)
{
    public async Task<InboxProblemReportResponse> HandleAsync(Guid problemReportId, CancellationToken cancellationToken)
    {
        ProblemReport report = await db.ProblemReports
                .AsNoTracking()
                .Include(candidate => candidate.Municipality)
                .SingleOrDefaultAsync(candidate => candidate.Id == problemReportId, cancellationToken)
            ?? throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);

        ProblemReportView view = await viewQuery.OfAsync(report, cancellationToken);
        IReadOnlyList<SuggestedExpert> experts = await expertsQuery.ForAsync(report, cancellationToken);

        return report.ToInboxResponse(view, experts);
    }
}
