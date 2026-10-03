using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Castor.Api.Features.GrantCalls;

/// <summary>"Szkic naboru": the assistant drafts a call for a blank spot of the radar; it is stored as a draft to edit.</summary>
public sealed class DraftGrantCallHandler(CastorDbContext db, GrantCallDrafter drafter, IOptions<MatchingOptions> matching, IClock clock)
{
    private const int SampleSize = 5;

    public async Task<GrantCallResponse> HandleAsync(DraftGrantCallRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        string code = request.ChallengeAreaCode?.Trim() ?? string.Empty;
        ChallengeArea area = await db.ChallengeAreas.SingleOrDefaultAsync(candidate => candidate.Code == code, cancellationToken)
            ?? throw new DomainException("Choose an existing challenge area.");
        Municipality? municipality = await FindMunicipalityAsync(request.Teryt, cancellationToken);

        List<string> unmatched = await UnmatchedDescriptionsAsync(area, municipality, cancellationToken);
        List<string> sample = [.. unmatched.Take(SampleSize)];
        GrantCallDraftResult draft = await drafter.DraftAsync(area, municipality, unmatched.Count, sample, cancellationToken);

        var grantCall = GrantCall.Draft(draft.Title, draft.Description, draft.Criteria ?? [], [area], opensOn: null, closesOn: null, clock.UtcNow);
        db.GrantCalls.Add(grantCall);
        await db.SaveChangesAsync(cancellationToken);

        return grantCall.ToResponse();
    }

    /// <summary>The anonymized descriptions of the blank spot's reports — the problems the call should answer.</summary>
    private async Task<List<string>> UnmatchedDescriptionsAsync(ChallengeArea area, Municipality? municipality, CancellationToken cancellationToken)
    {
        int threshold = matching.Value.HybridThreshold;
        IQueryable<ProblemReport> reports = db.ProblemReports
            .Where(report => report.MatchedAt != null && report.ChallengeAreaCodes.Count > 0 && report.ChallengeAreaCodes[0] == area.Code)
            .Where(report => !db.MatchResults.Any(match =>
                match.ProblemReportId == report.Id && match.Kind == MatchKind.MATCH && match.Score >= threshold));
        if (municipality is not null)
        {
            reports = reports.Where(report => report.MunicipalityId == municipality.Id);
        }

        return await reports.OrderByDescending(report => report.CreatedAt).Select(report => report.Description).ToListAsync(cancellationToken);
    }

    private async Task<Municipality?> FindMunicipalityAsync(string? teryt, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(teryt))
        {
            return null;
        }

        string trimmed = teryt.Trim();
        return await db.Municipalities.SingleOrDefaultAsync(candidate => candidate.Teryt == trimmed, cancellationToken)
            ?? throw new DomainException("The municipality does not exist.");
    }
}
