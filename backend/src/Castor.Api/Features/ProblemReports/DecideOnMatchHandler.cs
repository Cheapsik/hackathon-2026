using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>
/// "Czy to spełnia Twoją potrzebę?" under a matched innovation (docs/features.md §1): a signal of how well matching
/// hit, kept with the match. Whoever may open the report decides.
/// </summary>
public sealed class DecideOnMatchHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    ProblemReportViewQuery viewQuery,
    IClock clock)
{
    public async Task<ProblemReportResponse> HandleAsync(
        Guid problemReportId,
        Guid innovationId,
        string? presentedTrackingCode,
        DecideOnMatchRequest request,
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

        MatchResult match = await db.MatchResults.SingleOrDefaultAsync(
                candidate => candidate.ProblemReportId == report.Id
                    && candidate.Kind == MatchKind.MATCH
                    && candidate.InnovationId == innovationId,
                cancellationToken)
            ?? throw new DomainException("This innovation is not among the report's matches.", StatusCodes.Status404NotFound);

        match.Decide(verdict, request.Note, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        ProblemReportView view = await viewQuery.OfAsync(report, cancellationToken);
        bool showOriginal = report.ShowsOriginalTo(userId, isAdmin);
        return report.ToResponse(view, showOriginal);
    }
}
