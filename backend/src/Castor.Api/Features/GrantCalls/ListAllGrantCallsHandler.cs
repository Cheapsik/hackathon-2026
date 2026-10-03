using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.GrantCalls;

/// <summary>Every call, drafts included, for the administrator's panel.</summary>
public sealed class ListAllGrantCallsHandler(CastorDbContext db)
{
    public async Task<IReadOnlyList<GrantCallResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        List<GrantCall> grantCalls = await db.GrantCalls.AsNoTracking().OrderByDescending(grantCall => grantCall.UpdatedAt).ToListAsync(cancellationToken);

        return [.. grantCalls.Select(grantCall => grantCall.ToResponse())];
    }
}
