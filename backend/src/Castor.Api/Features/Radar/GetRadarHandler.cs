using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Castor.Api.Features.Radar;

/// <summary>
/// "Radar": needs by challenge area, gmina and month, and blank spots — reports the library has no good answer for
/// (no match at or above the hybrid threshold). The figures are counts over classified reports in the period.
/// </summary>
public sealed class GetRadarHandler(CastorDbContext db, IClock clock, IOptions<MatchingOptions> matching)
{
    private const int TopMunicipalities = 20;

    public async Task<RadarResponse> HandleAsync(GetRadarRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        DateOnly today = DateOnly.FromDateTime(clock.UtcNow.UtcDateTime);
        DateOnly to = request.To ?? today;
        DateOnly from = request.From ?? to.AddMonths(-12);
        if (to < from)
        {
            throw new DomainException("The period ends after it starts.");
        }

        var fromTime = new DateTimeOffset(from.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        var toTime = new DateTimeOffset(to.AddDays(1).ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);

        List<ProblemReport> reports = await db.ProblemReports
            .AsNoTracking()
            .Include(report => report.Municipality)
            .Where(report => report.ClassifiedAt != null && report.CreatedAt >= fromTime && report.CreatedAt < toTime)
            .ToListAsync(cancellationToken);
        List<Guid> reportIds = [.. reports.Select(report => report.Id)];

        int threshold = matching.Value.HybridThreshold;
        List<Guid> wellMatched = await db.MatchResults
            .Where(match => reportIds.Contains(match.ProblemReportId) && match.Kind == MatchKind.MATCH && match.Score >= threshold)
            .Select(match => match.ProblemReportId)
            .Distinct()
            .ToListAsync(cancellationToken);
        HashSet<Guid> matchedIds = [.. wellMatched];

        List<ChallengeArea> areas = await db.ChallengeAreas.AsNoTracking().OrderBy(area => area.Number).ToListAsync(cancellationToken);
        List<List<string>> genomeAreas = await db.InnovationGenomes.Select(genome => genome.ChallengeAreaCodes).ToListAsync(cancellationToken);

        List<AreaNeedResponse> byArea = [.. areas.Select(area => new AreaNeedResponse(
            area.Code,
            area.Name,
            reports.Count(report => report.MainChallengeAreaCode == area.Code),
            reports.Count(report => report.MainChallengeAreaCode == area.Code && IsUnmatched(report, matchedIds)),
            genomeAreas.Count(codes => codes.Contains(area.Code))))];

        // Grouped by key, not by the Municipality instance: a no-tracking query gives every report its own copy.
        List<MunicipalityNeedResponse> byMunicipality = [.. reports
            .Where(report => report.Municipality is not null)
            .GroupBy(report => new { report.Municipality!.Teryt, report.Municipality.QualifiedName })
            .Select(group => new MunicipalityNeedResponse(
                group.Key.Teryt,
                group.Key.QualifiedName,
                group.Count(),
                group.Count(report => IsUnmatched(report, matchedIds))))
            .OrderByDescending(need => need.Reports)
            .Take(TopMunicipalities)];

        List<MonthlyNeedResponse> byMonth = [.. reports
            .Where(report => report.MainChallengeAreaCode is not null)
            .GroupBy(report => new { Month = report.CreatedAt.ToString("yyyy-MM", CultureInfo.InvariantCulture), Area = report.MainChallengeAreaCode! })
            .Select(group => new MonthlyNeedResponse(group.Key.Month, group.Key.Area, group.Count()))
            .OrderBy(need => need.Month)
            .ThenBy(need => need.ChallengeAreaCode)];

        List<BlankSpotResponse> blankSpots = [.. reports
            .Where(report => report.MainChallengeAreaCode is not null && IsUnmatched(report, matchedIds))
            .GroupBy(report => new { Area = report.MainChallengeAreaCode!, Teryt = report.Municipality?.Teryt, Name = report.Municipality?.QualifiedName })
            .Select(group => new BlankSpotResponse(
                group.Key.Area,
                areas.FirstOrDefault(area => area.Code == group.Key.Area)?.Name ?? group.Key.Area,
                group.Key.Teryt,
                group.Key.Name,
                group.Count()))
            .OrderByDescending(spot => spot.UnmatchedReports)];

        return new RadarResponse(from, to, reports.Count, byArea, byMunicipality, byMonth, blankSpots);
    }

    /// <summary>Matched, and no match reached the hybrid threshold. A report still waiting for answers is not counted.</summary>
    private static bool IsUnmatched(ProblemReport report, HashSet<Guid> wellMatchedIds)
    {
        return report.MatchedAt is not null && !wellMatchedIds.Contains(report.Id);
    }
}
