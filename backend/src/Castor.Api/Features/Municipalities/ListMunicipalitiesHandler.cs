using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Municipalities;

/// <summary>The gmina search of the report form: names starting with the typed text, diacritics optional.</summary>
public sealed class ListMunicipalitiesHandler(CastorDbContext db)
{
    /// <summary>The form shows a short list of suggestions, not the whole register.</summary>
    private const int SuggestionLimit = 20;

    public async Task<IReadOnlyList<MunicipalityResponse>> HandleAsync(
        ListMunicipalitiesRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        IQueryable<Municipality> query = db.Municipalities
            .AsNoTracking()
            .OrderBy(municipality => municipality.Name)
            .ThenBy(municipality => municipality.Teryt);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            string pattern = $"{request.Search.Trim()}%";
            query = query
                .Where(municipality => EF.Functions.ILike(EF.Functions.Unaccent(municipality.Name), EF.Functions.Unaccent(pattern)))
                .Take(SuggestionLimit);
        }

        List<Municipality> municipalities = await query.ToListAsync(cancellationToken);

        return [.. municipalities.Select(municipality => municipality.ToResponse())];
    }
}
