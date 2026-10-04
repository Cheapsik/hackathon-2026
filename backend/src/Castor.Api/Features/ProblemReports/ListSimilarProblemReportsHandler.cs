using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>
/// One page of similar reports for a problem report the caller may open — same visibility as reading the report.
/// </summary>
public sealed class ListSimilarProblemReportsHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    ProblemReportViewQuery viewQuery)
{
    public async Task<SimilarProblemReportsResponse> HandleAsync(
        Guid problemReportId,
        string? presentedTrackingCode,
        ListSimilarProblemReportsRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        int skip = request.Skip ?? 0;
        int take = request.Take ?? ProblemReportViewQuery.DefaultSimilarPageSize;
        if (skip < 0)
        {
            throw new DomainException("Skip cannot be negative.");
        }

        if (take < 1 || take > ProblemReportViewQuery.MaxSimilarPageSize)
        {
            throw new DomainException(
                $"Take must be between 1 and {ProblemReportViewQuery.MaxSimilarPageSize}.");
        }

        Guid? userId = currentUser.UserIdOrNull;
        bool isAdmin = currentUser.IsAdmin;
        ProblemReport? report = await db.ProblemReports
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == problemReportId, cancellationToken);

        if (report is null || !report.IsVisibleTo(userId, isAdmin, presentedTrackingCode))
        {
            throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);
        }

        SimilarProblemReports similar = await viewQuery.SimilarAsync(report, skip, take, cancellationToken);
        List<SimilarProblemReportResponse> items = [.. similar.Items.Select(item =>
            new SimilarProblemReportResponse(item.Id, item.Description, item.Municipality, item.CreatedAt))];

        return new SimilarProblemReportsResponse(similar.Reports, similar.Municipalities, items);
    }
}
