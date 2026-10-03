using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Innovations;

/// <summary>Innovations by title; the full library with filters comes with module II.</summary>
public sealed class ListInnovationsHandler(CastorDbContext db)
{
    private const int Limit = 200;

    public async Task<IReadOnlyList<InnovationSummaryResponse>> HandleAsync(ListInnovationsRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        IQueryable<Innovation> query = db.Innovations.AsNoTracking().Include(innovation => innovation.Genome);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            string pattern = $"%{request.Search.Trim()}%";
            query = query.Where(innovation => EF.Functions.ILike(EF.Functions.Unaccent(innovation.Title), EF.Functions.Unaccent(pattern)));
        }

        List<Innovation> innovations = await query.OrderBy(innovation => innovation.Title).Take(Limit).ToListAsync(cancellationToken);

        return [.. innovations.Select(innovation => new InnovationSummaryResponse(
            innovation.Id,
            innovation.Title,
            innovation.Categories,
            innovation.Stage.ToString(),
            innovation.Genome is not null,
            innovation.Genome?.Status.ToString()))];
    }
}
