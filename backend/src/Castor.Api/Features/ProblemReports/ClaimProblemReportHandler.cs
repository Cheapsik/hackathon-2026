using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>A signed-in user takes an anonymous report into the account by its tracking code — once per report.</summary>
public sealed class ClaimProblemReportHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    ProblemReportViewQuery viewQuery,
    IClock clock)
{
    public async Task<ProblemReportResponse> HandleAsync(ClaimProblemReportRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Guid userId = currentUser.UserId;
        string? normalized = TrackingCode.Normalize(request.TrackingCode);
        if (normalized is null)
        {
            throw new DomainException("A tracking code has eight characters, e.g. K7QM-2XDF.");
        }

        ProblemReport report = await db.ProblemReports
                .Include(candidate => candidate.Municipality)
                .SingleOrDefaultAsync(candidate => candidate.TrackingCode == normalized, cancellationToken)
            ?? throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);

        report.ClaimBy(userId, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        ProblemReportView view = await viewQuery.OfAsync(report, cancellationToken);
        return report.ToResponse(view, showOriginal: true);
    }
}
