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

        SimilarProblemReports similar = await SimilarAsync(report, skip: 0, take: DefaultSimilarPageSize, cancellationToken);

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

    /// <summary>First page of similar reports embedded in a problem-report response.</summary>
    public const int DefaultSimilarPageSize = 5;

    /// <summary>Hard cap on one page so a client cannot pull the whole inbox in one go.</summary>
    public const int MaxSimilarPageSize = 20;

    private const int DescriptionExcerptLength = 220;

    /// <summary>
    /// Other reports with the same main challenge area. Causes come from the model as free text and cannot be compared;
    /// vector similarity joins once embeddings are decided (docs/TODO.md). Returns the full counts and one page of
    /// examples (anonymized text only — never another report's tracking code).
    /// </summary>
    public async Task<SimilarProblemReports> SimilarAsync(
        ProblemReport report,
        int skip,
        int take,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(report);
        if (skip < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(skip));
        }

        if (take < 1 || take > MaxSimilarPageSize)
        {
            throw new ArgumentOutOfRangeException(nameof(take));
        }

        string? mainArea = report.MainChallengeAreaCode;
        if (mainArea is null)
        {
            return new SimilarProblemReports(0, 0, []);
        }

        IQueryable<ProblemReport> similar = db.ProblemReports
            .AsNoTracking()
            .Where(other => other.Id != report.Id && other.ChallengeAreaCodes.Count > 0 && other.ChallengeAreaCodes[0] == mainArea);

        int reports = await similar.CountAsync(cancellationToken);
        int municipalities = await similar
            .Where(other => other.MunicipalityId != null)
            .Select(other => other.MunicipalityId)
            .Distinct()
            .CountAsync(cancellationToken);

        Guid? municipalityId = report.MunicipalityId;
        List<SimilarProblemReportItem> items = await similar
            .Include(other => other.Municipality)
            .OrderByDescending(other => municipalityId != null && other.MunicipalityId == municipalityId)
            .ThenByDescending(other => other.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(other => new SimilarProblemReportItem(
                other.Id,
                other.Description,
                other.Municipality != null ? other.Municipality.QualifiedName : null,
                other.CreatedAt))
            .ToListAsync(cancellationToken);

        return new SimilarProblemReports(
            reports,
            municipalities,
            [.. items.Select(item => item with { Description = Excerpt(item.Description) })]);
    }

    private static string Excerpt(string description)
    {
        string trimmed = description.Trim();
        if (trimmed.Length <= DescriptionExcerptLength)
        {
            return trimmed;
        }

        return $"{trimmed[..DescriptionExcerptLength].TrimEnd()}…";
    }
}
