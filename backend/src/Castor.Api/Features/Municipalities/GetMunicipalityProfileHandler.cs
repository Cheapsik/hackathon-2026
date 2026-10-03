using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Municipalities;

public sealed class GetMunicipalityProfileHandler(CastorDbContext db, MunicipalityPortraitQuery portraits)
{
    public async Task<MunicipalityProfileResponse> HandleAsync(
        string teryt,
        GetMunicipalityProfileRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Municipality municipality = await db.Municipalities.AsNoTracking().SingleOrDefaultAsync(candidate => candidate.Teryt == teryt, cancellationToken)
            ?? throw new DomainException("The municipality does not exist.", StatusCodes.Status404NotFound);

        List<string> areas = [];
        if (!string.IsNullOrWhiteSpace(request.ChallengeArea))
        {
            string code = request.ChallengeArea.Trim();
            bool exists = await db.ChallengeAreas.AsNoTracking().AnyAsync(area => area.Code == code, cancellationToken);
            if (!exists)
            {
                throw new DomainException("The challenge area does not exist.", StatusCodes.Status404NotFound);
            }

            areas.Add(code);
        }

        MunicipalityPortrait portrait = await portraits.ForAsync(municipality, areas, cancellationToken);
        List<ProfileIndicatorResponse> indicators = [.. portrait.Indicators.Select(indicator => new ProfileIndicatorResponse(
            indicator.IndicatorId,
            indicator.Name,
            indicator.Unit,
            indicator.Level.ToString(),
            indicator.Value,
            indicator.RegionAverage,
            indicator.Year,
            indicator.General))];

        return new MunicipalityProfileResponse(
            municipality.Teryt,
            municipality.Name,
            municipality.QualifiedName,
            municipality.Powiat,
            indicators);
    }
}
