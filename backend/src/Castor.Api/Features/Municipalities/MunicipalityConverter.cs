namespace Castor.Api.Features.Municipalities;

internal static class MunicipalityConverter
{
    public static MunicipalityResponse ToResponse(this Municipality municipality)
    {
        string type = municipality.Type.ToString();

        return new MunicipalityResponse(municipality.Teryt, municipality.Name, municipality.QualifiedName, type, municipality.Powiat);
    }
}
