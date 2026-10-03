using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>"Szkic odpowiedzi do edycji": the assistant writes a reply draft, which replaces the stored one.</summary>
public sealed class DraftProblemReportReplyHandler(
    CastorDbContext db,
    ReplyDrafter drafter,
    ProblemReportViewQuery viewQuery,
    SuggestedExpertsQuery expertsQuery,
    IClock clock)
{
    public async Task<InboxProblemReportResponse> HandleAsync(Guid problemReportId, CancellationToken cancellationToken)
    {
        ProblemReport report = await db.ProblemReports
                .Include(candidate => candidate.Municipality)
                .SingleOrDefaultAsync(candidate => candidate.Id == problemReportId, cancellationToken)
            ?? throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);

        ProblemReportView view = await viewQuery.OfAsync(report, cancellationToken);
        string draft = await drafter.DraftAsync(report, view.ChallengeAreas, view.Matches, cancellationToken);
        report.SaveReplyDraft(draft, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        IReadOnlyList<SuggestedExpert> experts = await expertsQuery.ForAsync(report, cancellationToken);
        return report.ToInboxResponse(view, experts);
    }
}
