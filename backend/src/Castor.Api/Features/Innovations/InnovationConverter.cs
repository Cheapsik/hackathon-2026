namespace Castor.Api.Features.Innovations;

internal static class InnovationConverter
{
    public static InnovationResponse ToResponse(this Innovation innovation)
    {
        string stage = innovation.Stage.ToString();
        string source = innovation.Source.ToString();
        IReadOnlyList<string> areas = innovation.Genome?.ChallengeAreaCodes ?? [];

        return new InnovationResponse(
            innovation.Id,
            innovation.Title,
            innovation.ShortDescription,
            innovation.Categories,
            innovation.Solution,
            innovation.Problems,
            innovation.TargetGroup,
            innovation.Beneficiaries,
            innovation.Evidence,
            innovation.Organization,
            innovation.CardUrl,
            innovation.VideoUrl,
            innovation.MaterialsZipUrl,
            innovation.CardPdfUrl,
            innovation.TermsUrl,
            innovation.Featured,
            innovation.InServiceModel,
            stage,
            areas,
            source,
            innovation.SeeksTesters);
    }
}
