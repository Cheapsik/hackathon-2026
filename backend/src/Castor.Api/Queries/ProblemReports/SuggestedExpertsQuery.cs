using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Queries;

/// <summary>Experts of a report's challenge areas, those covering the most of them first — the inbox suggests them.</summary>
public sealed class SuggestedExpertsQuery(CastorDbContext db)
{
    private const int Limit = 3;

    public async Task<IReadOnlyList<SuggestedExpert>> ForAsync(ProblemReport report, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(report);

        List<string> areaCodes = report.ChallengeAreaCodes;
        if (areaCodes.Count == 0)
        {
            return [];
        }

        List<User> experts = await db.Users
            .AsNoTracking()
            .Where(user => user.Role == UserRole.EXPERT && user.ChallengeAreaCodes.Any(code => areaCodes.Contains(code)))
            .ToListAsync(cancellationToken);

        return [.. experts
            .Select(expert => new SuggestedExpert(expert.Id, expert.Email, [.. expert.ChallengeAreaCodes.Where(areaCodes.Contains)]))
            .OrderByDescending(expert => expert.SharedChallengeAreaCodes.Count)
            .ThenBy(expert => expert.Email)
            .Take(Limit)];
    }
}
