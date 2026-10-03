using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.GrantCalls;

public sealed class ReviseGrantCallHandler(CastorDbContext db, IClock clock)
{
    public async Task<GrantCallResponse> HandleAsync(Guid grantCallId, ReviseGrantCallRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        GrantCall grantCall = await db.GrantCalls.SingleOrDefaultAsync(candidate => candidate.Id == grantCallId, cancellationToken)
            ?? throw new DomainException("The grant call does not exist.", StatusCodes.Status404NotFound);

        List<ChallengeArea> areas = await FindAreasAsync(request.ChallengeAreaCodes ?? [], cancellationToken);
        grantCall.Revise(request.Title, request.Description, request.Criteria ?? [], areas, request.OpensOn, request.ClosesOn, clock.UtcNow);
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
