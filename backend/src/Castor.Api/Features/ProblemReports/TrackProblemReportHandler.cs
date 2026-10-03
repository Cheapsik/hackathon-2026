using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>"Śledź zgłoszenie": the tracking code alone opens the report, without an account.</summary>
public sealed class TrackProblemReportHandler(CastorDbContext db, CurrentUser currentUser, ProblemReportViewQuery viewQuery)
{
    public async Task<ProblemReportResponse> HandleAsync(string trackingCode, CancellationToken cancellationToken)
    {
        string? normalized = TrackingCode.Normalize(trackingCode);
        if (normalized is null)
        {
            throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);
        }

        ProblemReport report = await db.ProblemReports
                .AsNoTracking()
                .Include(candidate => candidate.Municipality)
                .SingleOrDefaultAsync(candidate => candidate.TrackingCode == normalized, cancellationToken)
            ?? throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);

        ProblemReportView view = await viewQuery.OfAsync(report, cancellationToken);
        bool showOriginal = report.ShowsOriginalTo(currentUser.UserIdOrNull, currentUser.IsAdmin);
        return report.ToResponse(view, showOriginal);
    }
}
