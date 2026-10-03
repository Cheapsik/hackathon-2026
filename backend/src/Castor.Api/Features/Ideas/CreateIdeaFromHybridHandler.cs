using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>
/// "Rozwiń w Kreatorze": a draft filled in from the hybrid proposed for a problem report, for whoever may see the report
/// — its author, an administrator, or a signed-in holder of its tracking code.
/// </summary>
public sealed class CreateIdeaFromHybridHandler(
    CastorDbContext db,
    IdeaReaderFactory readers,
    IdeaViewQuery viewQuery,
    IClock clock)
{
    public async Task<IdeaResponse> HandleAsync(
        CreateIdeaFromHybridRequest request,
        string? presentedTrackingCode,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.ProblemReportId is not Guid reportId)
        {
            throw new DomainException("A hybrid is developed from a problem report.");
        }

        IdeaReader reader = await readers.CurrentAsync(cancellationToken);
        ProblemReport? report = await db.ProblemReports
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == reportId, cancellationToken);
        if (report is null || !report.IsVisibleTo(reader.UserId, reader.IsAdmin, presentedTrackingCode))
        {
            throw new DomainException("The problem report does not exist.", StatusCodes.Status404NotFound);
        }

        MatchResult hybrid = await db.MatchResults
                .AsNoTracking()
                .SingleOrDefaultAsync(match => match.ProblemReportId == reportId && match.Kind == MatchKind.HYBRID, cancellationToken)
            ?? throw new DomainException("The problem report has no hybrid.", StatusCodes.Status404NotFound);

        List<string> areaCodes = report.ChallengeAreaCodes;
        List<ChallengeArea> areas = await db.ChallengeAreas
            .AsNoTracking()
            .Where(area => areaCodes.Contains(area.Code))
            .ToListAsync(cancellationToken);
        List<ChallengeArea> ordered = [.. areas.OrderBy(area => areaCodes.IndexOf(area.Code))];

        var idea = Idea.FromHybrid(reader.UserId, hybrid, ordered, clock.UtcNow);
        db.Ideas.Add(idea);
        await db.SaveChangesAsync(cancellationToken);

        IdeaView view = await viewQuery.OfAsync(idea, cancellationToken);
        return idea.ToResponse(view, reader);
    }
}
