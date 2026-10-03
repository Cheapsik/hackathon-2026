using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Queries;

/// <summary>
/// The challenge areas of a user who is an expert — which conversations they take part in. Read from the account, so
/// areas an administrator changes apply at once.
/// </summary>
public sealed class ExpertChallengeAreasQuery(CastorDbContext db)
{
    /// <returns>Empty for a user who is not an expert, and for no user at all.</returns>
    public async Task<string[]> OfAsync(Guid? userId, CancellationToken cancellationToken)
    {
        if (userId is null)
        {
            return [];
        }

        List<string>? areas = await db.Users
            .AsNoTracking()
            .Where(user => user.Id == userId && user.Role == UserRole.EXPERT)
            .Select(user => user.ChallengeAreaCodes)
            .SingleOrDefaultAsync(cancellationToken);

        return areas is null ? [] : [.. areas];
    }
}
