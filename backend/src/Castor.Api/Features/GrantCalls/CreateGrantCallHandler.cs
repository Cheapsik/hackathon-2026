using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.GrantCalls;

/// <summary>A new call starts as a draft; opening it is a separate step.</summary>
public sealed class CreateGrantCallHandler(CastorDbContext db, IClock clock)
{
    public async Task<GrantCallResponse> HandleAsync(CreateGrantCallRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        List<ChallengeArea> areas = await FindAreasAsync(request.ChallengeAreaCodes ?? [], cancellationToken);
        var grantCall = GrantCall.Draft(request.Title, request.Description, request.Criteria ?? [], areas, request.OpensOn, request.ClosesOn, clock.UtcNow);
        db.GrantCalls.Add(grantCall);
        await db.SaveChangesAsync(cancellationToken);

        return grantCall.ToResponse();
    }

    private async Task<List<ChallengeArea>> FindAreasAsync(IReadOnlyList<string> codes, CancellationToken cancellationToken)
    {
        List<ChallengeArea> areas = await db.ChallengeAreas.Where(area => codes.Contains(area.Code)).ToListAsync(cancellationToken);
        if (areas.Count != codes.Distinct().Count())
        {
            throw new DomainException("One of the challenge areas does not exist.");
        }

        return areas;
    }
}
