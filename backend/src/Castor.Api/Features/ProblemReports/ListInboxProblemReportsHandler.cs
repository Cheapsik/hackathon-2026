using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ProblemReports;

/// <summary>
/// The administrators' inbox: one row per case, the ones more people joined first, then newest first. A report that
/// joined a case is counted there instead of listed. It refreshes live on ProblemReportCreated (module VI).
/// </summary>
public sealed class ListInboxProblemReportsHandler(CastorDbContext db)
{
    private const int Limit = 200;

    private const int PreviewLength = 160;

    public async Task<IReadOnlyList<InboxProblemReportSummaryResponse>> HandleAsync(
        ListInboxProblemReportsRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        IQueryable<ProblemReport> query = db.ProblemReports
            .AsNoTracking()
            .Include(report => report.Municipality)
            .Where(report => report.JoinedProblemReportId == null);

        if (request.Status is not null)
        {
            if (!NamedEnum.TryParse(request.Status, out ProblemReportStatus status))
            {
                throw new DomainException("Status is RECEIVED, IN_ANALYSIS, WITH_EXPERT, ANSWERED or CLOSED.");
            }

            query = query.Where(report => report.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(request.ChallengeArea))
        {
            string area = request.ChallengeArea.Trim();
            query = query.Where(report => report.ChallengeAreaCodes.Count > 0 && report.ChallengeAreaCodes[0] == area);
        }

        if (!string.IsNullOrWhiteSpace(request.Teryt))
        {
            string teryt = request.Teryt.Trim();
            query = query.Where(report => report.Municipality != null && report.Municipality.Teryt == teryt);
        }

        List<ProblemReport> reports = await query
            .OrderByDescending(report => db.ProblemReports.Count(joined => joined.JoinedProblemReportId == report.Id))
            .ThenByDescending(report => report.CreatedAt)
            .Take(Limit)
            .ToListAsync(cancellationToken);
        List<Guid> reportIds = [.. reports.Select(report => report.Id)];

        Dictionary<Guid, int> joinedCounts = await db.ProblemReports
            .Where(joined => joined.JoinedProblemReportId != null && reportIds.Contains(joined.JoinedProblemReportId.Value))
            .GroupBy(joined => joined.JoinedProblemReportId!.Value)
            .Select(group => new { CaseId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(row => row.CaseId, row => row.Count, cancellationToken);

        Dictionary<Guid, int?> bestScores = await db.MatchResults
            .Where(match => reportIds.Contains(match.ProblemReportId) && match.Kind == MatchKind.MATCH)
            .GroupBy(match => match.ProblemReportId)
            .Select(group => new { ReportId = group.Key, Best = group.Max(match => match.Score) })
            .ToDictionaryAsync(row => row.ReportId, row => row.Best, cancellationToken);

        Dictionary<string, string> areaNames = await db.ChallengeAreas.ToDictionaryAsync(area => area.Code, area => area.Name, cancellationToken);

        return [.. reports.Select(report => Summarize(report, bestScores.GetValueOrDefault(report.Id), JoinedCountOf(report, joinedCounts), areaNames))];
    }

    /// <summary>A case nobody joined has no group in the count: zero people joined it.</summary>
    private static int JoinedCountOf(ProblemReport report, Dictionary<Guid, int> joinedCounts)
    {
        return joinedCounts.TryGetValue(report.Id, out int count) ? count : 0;
    }

    private static InboxProblemReportSummaryResponse Summarize(
        ProblemReport report,
        int? bestScore,
        int joinedCount,
        Dictionary<string, string> areaNames)
    {
        string trackingCode = TrackingCode.Format(report.TrackingCode);
        string? mainArea = report.MainChallengeAreaCode is string code ? areaNames.GetValueOrDefault(code, code) : null;
        string preview = report.Description.Length > PreviewLength ? report.Description[..PreviewLength] + "…" : report.Description;

        return new InboxProblemReportSummaryResponse(
            report.Id,
            trackingCode,
            report.Status.ToString(),
            report.Urgency?.ToString(),
            report.Channel.ToString(),
            mainArea,
            report.Municipality?.QualifiedName,
            preview,
            report.AwaitsAnswers,
            report.MatchedAt is not null,
            bestScore,
            report.ReplyDraft is not null,
            joinedCount,
            report.CreatedAt);
    }
}
