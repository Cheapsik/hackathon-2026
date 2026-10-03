using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>
/// "Śledź zgłoszenie": the tracking code alone opens the report, without an account. A report whose matching the
/// language model cut off is matched again first.
/// </summary>
public sealed class TrackProblemReportHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    ProblemReportMatching matching,
    ProblemReportViewQuery viewQuery)
{
    public async Task<ProblemReportResponse> HandleAsync(string trackingCode, CancellationToken cancellationToken)
    {
        string? normalized = TrackingCode.Normalize(trackingCode);
        if (normalized is null)
        {
            throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);
        }

        ProblemReport report = await db.ProblemReports
                .Include(candidate => candidate.Municipality)
                .SingleOrDefaultAsync(candidate => candidate.TrackingCode == normalized, cancellationToken)
            ?? throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);

        if (report.AwaitsMatching)
        {
            await matching.CompleteAsync(report, cancellationToken);
        }

        ProblemReportView view = await viewQuery.OfAsync(report, cancellationToken);
        bool showOriginal = report.ShowsOriginalTo(currentUser.UserIdOrNull, currentUser.IsAdmin);
        return report.ToResponse(view, showOriginal);
    }
}
