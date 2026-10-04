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

        int joinedCount = await db.ProblemReports.CountAsync(other => other.JoinedProblemReportId == report.Id, cancellationToken);
        JoinedCase? joinedCase = report.JoinedProblemReportId is Guid caseId
            ? await JoinedCaseAsync(caseId, cancellationToken)
            : null;

        return new ProblemReportView(matches, hybridSources, orderedAreas, similar, conversationId, joinedCount, joinedCase);
    }

    /// <summary>First page of similar reports embedded in a problem-report response.</summary>
    public const int DefaultSimilarPageSize = 5;

    /// <summary>Hard cap on one page so a client cannot pull the whole inbox in one go.</summary>
    public const int MaxSimilarPageSize = 20;

    private const int DescriptionExcerptLength = 220;

    /// <summary>
    /// Other reports with the same main challenge area. Causes come from the model as free text and cannot be compared;
    /// vector similarity joins once embeddings are decided (docs/TODO.md). Returns the full counts and one page of
    /// examples (anonymized text only — never another report's tracking code). A report that joined a case counts as
    /// a person but is not an example: its case is.
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
            return new SimilarProblemReports(0, 0, 0, []);
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

        IQueryable<ProblemReport> cases = similar.Where(other => other.JoinedProblemReportId == null);
        int caseCount = await cases.CountAsync(cancellationToken);

        Guid reportId = report.Id;
        Guid? municipalityId = report.MunicipalityId;
        List<SimilarProblemReportItem> items = await cases
            .OrderByDescending(other => municipalityId != null && other.MunicipalityId == municipalityId)
            .ThenByDescending(other => other.CreatedAt)
            .Skip(skip)
            .Take(take)
            .Select(other => new SimilarProblemReportItem(
                other.Id,
                other.Description,
                other.Municipality != null ? other.Municipality.QualifiedName : null,
                other.Status,
                db.SimilarReportVerdicts
                    .Where(verdict => verdict.ProblemReportId == reportId && verdict.SimilarProblemReportId == other.Id)
                    .Select(verdict => (Verdict?)verdict.Verdict)
                    .FirstOrDefault(),
                other.CreatedAt))
            .ToListAsync(cancellationToken);

        return new SimilarProblemReports(
            reports,
            municipalities,
            caseCount,
            [.. items.Select(item => item with { Description = Excerpt(item.Description) })]);
    }

    private async Task<JoinedCase> JoinedCaseAsync(Guid caseId, CancellationToken cancellationToken)
    {
        ProblemReport joined = await db.ProblemReports
            .AsNoTracking()
            .Include(candidate => candidate.Municipality)
            .SingleAsync(candidate => candidate.Id == caseId, cancellationToken);
        int joinedCount = await db.ProblemReports.CountAsync(other => other.JoinedProblemReportId == caseId, cancellationToken);

        return new JoinedCase(
            joined.Id,
            joined.Description,
            joined.Municipality?.QualifiedName,
            joined.Status,
            joinedCount,
            joined.CreatedAt);
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
