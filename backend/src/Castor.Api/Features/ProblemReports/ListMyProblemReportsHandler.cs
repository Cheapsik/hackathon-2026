using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>The signed-in user's own reports, newest first.</summary>
public sealed class ListMyProblemReportsHandler(CastorDbContext db, CurrentUser currentUser)
{
    public async Task<IReadOnlyList<ProblemReportSummaryResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        Guid userId = currentUser.UserId;

        List<ProblemReport> reports = await db.ProblemReports
            .AsNoTracking()
            .Where(report => report.AuthorId == userId)
            .OrderByDescending(report => report.CreatedAt)
            .ToListAsync(cancellationToken);

        return [.. reports.Select(report => report.ToSummaryResponse())];
    }
}
