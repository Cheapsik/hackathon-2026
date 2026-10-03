using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Innovations;

/// <summary>The library: filter by area, category, stage and target group, and search the title.</summary>
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

        if (!string.IsNullOrWhiteSpace(request.ChallengeArea))
        {
            string area = request.ChallengeArea.Trim();
            query = query.Where(innovation => innovation.Genome != null && innovation.Genome.ChallengeAreaCodes.Contains(area));
        }

        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            string category = request.Category.Trim();
            query = query.Where(innovation => innovation.Categories.Contains(category));
        }

        if (!string.IsNullOrWhiteSpace(request.Stage))
        {
            if (!NamedEnum.TryParse(request.Stage, out InnovationStage stage))
            {
                throw new DomainException("Stage is IDEA, PROTOTYPE, TESTED or READY.");
            }

            query = query.Where(innovation => innovation.Stage == stage);
        }

        if (!string.IsNullOrWhiteSpace(request.TargetGroup))
        {
            string pattern = $"%{request.TargetGroup.Trim()}%";
            query = query.Where(innovation =>
                (innovation.TargetGroup != null && EF.Functions.ILike(EF.Functions.Unaccent(innovation.TargetGroup), EF.Functions.Unaccent(pattern)))
                || (innovation.Beneficiaries != null && EF.Functions.ILike(EF.Functions.Unaccent(innovation.Beneficiaries), EF.Functions.Unaccent(pattern))));
        }

        List<Innovation> innovations = await query.OrderBy(innovation => innovation.Title).Take(Limit).ToListAsync(cancellationToken);

        return [.. innovations.Select(innovation => new InnovationSummaryResponse(
            innovation.Id,
            innovation.Title,
            innovation.Categories,
            innovation.Stage.ToString(),
            innovation.Genome is not null,
            innovation.Genome?.Status.ToString(),
            innovation.ShortDescription,
            innovation.VideoUrl,
            innovation.Genome?.ChallengeAreaCodes ?? []))];
    }
}
