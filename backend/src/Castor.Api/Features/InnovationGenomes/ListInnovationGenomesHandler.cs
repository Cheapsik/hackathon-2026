using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.InnovationGenomes;

/// <summary>Genomes waiting for approval first, then the approved ones (module VI, "Wiedza").</summary>
public sealed class ListInnovationGenomesHandler(CastorDbContext db)
{
    public async Task<IReadOnlyList<InnovationGenomeResponse>> HandleAsync(
        ListInnovationGenomesRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        IQueryable<InnovationGenome> query = db.InnovationGenomes.AsNoTracking();
        if (request.Status is not null)
        {
            if (!NamedEnum.TryParse(request.Status, out InnovationGenomeStatus status))
            {
                throw new DomainException("Status is DRAFT or APPROVED.");
            }

            query = query.Where(genome => genome.Status == status);
        }

        List<InnovationGenome> genomes = await query.ToListAsync(cancellationToken);
        Dictionary<Guid, string> titles = await db.Innovations.ToDictionaryAsync(innovation => innovation.Id, innovation => innovation.Title, cancellationToken);

        return [.. genomes
            .OrderBy(genome => genome.Status)
            .ThenBy(genome => titles[genome.InnovationId])
            .Select(genome => genome.ToResponse(titles[genome.InnovationId]))];
    }
}
