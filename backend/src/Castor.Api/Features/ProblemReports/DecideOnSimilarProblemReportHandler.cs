using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>
/// "Czy to spełnia Twoją potrzebę?" under a similar report (docs/features.md §1): no, yes — join its case instead of
/// keeping a duplicate — or almost, with what differs. Whoever may open the report decides.
/// </summary>
public sealed class DecideOnSimilarProblemReportHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    ProblemReportViewQuery viewQuery,
    IClock clock)
{
    public async Task<ProblemReportResponse> HandleAsync(
        Guid problemReportId,
        Guid similarProblemReportId,
        string? presentedTrackingCode,
        DecideOnSimilarProblemReportRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!NamedEnum.TryParse(request.Verdict, out Verdict verdict))
        {
            throw new DomainException("Verdict is NO, YES or ALMOST.");
        }

        Guid? userId = currentUser.UserIdOrNull;
        bool isAdmin = currentUser.IsAdmin;
        ProblemReport? report = await db.ProblemReports
            .Include(candidate => candidate.Municipality)
            .SingleOrDefaultAsync(candidate => candidate.Id == problemReportId, cancellationToken);

        if (report is null || !report.IsVisibleTo(userId, isAdmin, presentedTrackingCode))
        {
            throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);
        }

        // A case others joined stays a case: joining it elsewhere would leave them following a case nobody works on.
        bool othersJoined = await db.ProblemReports.AnyAsync(other => other.JoinedProblemReportId == report.Id, cancellationToken);
        if (verdict == Verdict.YES && othersJoined)
        {
            throw new DomainException("Other people joined this report; it stays a case of its own.", StatusCodes.Status409Conflict);
        }

        ProblemReport similar = await db.ProblemReports
                .AsNoTracking()
                .SingleOrDefaultAsync(candidate => candidate.Id == similarProblemReportId, cancellationToken)
            ?? throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);
        SimilarReportVerdict? earlier = await db.SimilarReportVerdicts.SingleOrDefaultAsync(
            candidate => candidate.ProblemReportId == report.Id && candidate.SimilarProblemReportId == similar.Id,
            cancellationToken);

        SimilarReportVerdict decision = report.DecideOnSimilar(similar, earlier, verdict, request.Note, clock.UtcNow);
        if (earlier is null)
        {
            db.SimilarReportVerdicts.Add(decision);
        }

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (PostgresErrors.IsUniqueViolation(exception))
        {
            throw new DomainException("This similar report was just decided on. Open the report again.", StatusCodes.Status409Conflict);
        }

        ProblemReportView view = await viewQuery.OfAsync(report, cancellationToken);
        bool showOriginal = report.ShowsOriginalTo(userId, isAdmin);
        return report.ToResponse(view, showOriginal);
    }
}
