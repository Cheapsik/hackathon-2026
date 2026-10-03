using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

public sealed class GetProblemReportHandler(CastorDbContext db, CurrentUser currentUser, ProblemReportViewQuery viewQuery)
{
    /// <param name="presentedTrackingCode">The code a visitor without an account holds; the author and administrators need none.</param>
    public async Task<ProblemReportResponse> HandleAsync(
        Guid problemReportId,
        string? presentedTrackingCode,
        CancellationToken cancellationToken)
    {
        Guid? userId = currentUser.UserIdOrNull;
        bool isAdmin = currentUser.IsAdmin;
        ProblemReport? report = await db.ProblemReports
            .AsNoTracking()
            .Include(candidate => candidate.Municipality)
            .SingleOrDefaultAsync(candidate => candidate.Id == problemReportId, cancellationToken);

        if (report is null || !report.IsVisibleTo(userId, isAdmin, presentedTrackingCode))
        {
            throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);
        }

        ProblemReportView view = await viewQuery.OfAsync(report, cancellationToken);
        bool showOriginal = report.ShowsOriginalTo(userId, isAdmin);
        return report.ToResponse(view, showOriginal);
    }
}
