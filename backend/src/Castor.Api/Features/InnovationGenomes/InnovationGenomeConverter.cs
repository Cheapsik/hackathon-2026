namespace Castor.Api.Features.InnovationGenomes;

internal static class InnovationGenomeConverter
{
    public static InnovationGenomeResponse ToResponse(this InnovationGenome genome, string innovationTitle)
    {
        RequiredResources resources = genome.RequiredResources;
        string status = genome.Status.ToString();

        return new InnovationGenomeResponse(
            genome.Id,
            genome.InnovationId,
            innovationTitle,
            status,
            genome.RootCauses,
            genome.Mechanisms,
            genome.TargetGroups,
            resources.Institutions,
            resources.People,
            resources.Budget,
            resources.Infrastructure,
            genome.Scale,
            genome.ChallengeAreaCodes,
            genome.Summary,
            genome.ApprovedAt,
            genome.UpdatedAt);
    }
}
