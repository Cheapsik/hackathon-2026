using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>
/// Answers (or skips) the clarifying questions, then matches the report — once. The answers are saved before
/// matching, so a failure of the language model does not lose them.
/// </summary>
public sealed class AnswerProblemReportQuestionsHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    ProblemReportMatching matching,
    ProblemReportViewQuery viewQuery,
    IClock clock)
{
    public async Task<ProblemReportResponse> HandleAsync(
        Guid problemReportId,
        string? presentedTrackingCode,
        AnswerProblemReportQuestionsRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Guid? userId = currentUser.UserIdOrNull;
        bool isAdmin = currentUser.IsAdmin;
        ProblemReport? report = await db.ProblemReports
            .Include(candidate => candidate.Municipality)
            .SingleOrDefaultAsync(candidate => candidate.Id == problemReportId, cancellationToken);

        if (report is null || !report.IsVisibleTo(userId, isAdmin, presentedTrackingCode))
        {
            throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);
        }

        report.AnswerQuestions(request.Answers ?? [], clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        await matching.CompleteAsync(report, cancellationToken);

        ProblemReportView view = await viewQuery.OfAsync(report, cancellationToken);
        bool showOriginal = report.ShowsOriginalTo(userId, isAdmin);
        return report.ToResponse(view, showOriginal);
    }
}
