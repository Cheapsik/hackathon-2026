using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Queries;

/// <summary>
/// The stored matches of a problem report with their innovations, its challenge areas and the count of similar
/// reports — what every handler returning a report shows with it.
/// </summary>
public sealed class ProblemReportViewQuery(CastorDbContext db)
{
    public async Task<ProblemReportView> OfAsync(ProblemReport report, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(report);

        List<MatchResult> matches = await db.MatchResults
            .AsNoTracking()
            .Include(match => match.Innovation)
            .Where(match => match.ProblemReportId == report.Id)
            .OrderBy(match => match.Position)
            .ToListAsync(cancellationToken);

        List<Guid> sourceIds = [.. matches.SelectMany(match => match.SourceInnovationIds).Distinct()];
        Dictionary<Guid, Innovation> hybridSources = await db.Innovations
            .AsNoTracking()
            .Where(innovation => sourceIds.Contains(innovation.Id))
            .ToDictionaryAsync(innovation => innovation.Id, cancellationToken);

        List<ChallengeArea> areas = await db.ChallengeAreas
            .AsNoTracking()
            .Where(area => report.ChallengeAreaCodes.Contains(area.Code))
            .ToListAsync(cancellationToken);
        List<ChallengeArea> orderedAreas = [.. areas.OrderBy(area => report.ChallengeAreaCodes.IndexOf(area.Code))];

        SimilarProblemReports similar = await CountSimilarAsync(report, cancellationToken);

        // Every report gets its thread when it is created; reports from before threads got one in the migration.
        List<Guid> conversationIds = await db.Conversations
            .Where(conversation => conversation.ProblemReportId == report.Id)
            .Select(conversation => conversation.Id)
            .ToListAsync(cancellationToken);
        Guid conversationId = conversationIds.Count == 1
            ? conversationIds[0]
            : throw new InvalidOperationException($"Problem report {report.Id} has no thread.");

        return new ProblemReportView(matches, hybridSources, orderedAreas, similar, conversationId);
    }

    /// <summary>
    /// Other reports with the same main challenge area. Causes come from the model as free text and cannot be compared;
    /// vector similarity joins once embeddings are decided (docs/TODO.md).
    /// </summary>
    private async Task<SimilarProblemReports> CountSimilarAsync(ProblemReport report, CancellationToken cancellationToken)
    {
        string? mainArea = report.MainChallengeAreaCode;
        if (mainArea is null)
        {
            return new SimilarProblemReports(0, 0);
        }

        IQueryable<ProblemReport> similar = db.ProblemReports
            .Where(other => other.Id != report.Id && other.ChallengeAreaCodes.Count > 0 && other.ChallengeAreaCodes[0] == mainArea);

        int reports = await similar.CountAsync(cancellationToken);
        int municipalities = await similar
            .Where(other => other.MunicipalityId != null)
            .Select(other => other.MunicipalityId)
            .Distinct()
            .CountAsync(cancellationToken);

        return new SimilarProblemReports(reports, municipalities);
    }
}
