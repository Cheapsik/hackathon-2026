using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.GrantCalls;

/// <summary>Published calls: open ones for the Kreator's application generator, closed ones as history.</summary>
public sealed class ListGrantCallsHandler(CastorDbContext db)
{
    public async Task<IReadOnlyList<GrantCallResponse>> HandleAsync(ListGrantCallsRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        IQueryable<GrantCall> query = db.GrantCalls.AsNoTracking().Where(grantCall => grantCall.Status != GrantCallStatus.DRAFT);
        if (request.Open == true)
        {
            query = query.Where(grantCall => grantCall.Status == GrantCallStatus.OPEN);
        }

        List<GrantCall> grantCalls = await query.OrderByDescending(grantCall => grantCall.UpdatedAt).ToListAsync(cancellationToken);
        return [.. grantCalls.Select(grantCall => grantCall.ToResponse())];
    }
}
