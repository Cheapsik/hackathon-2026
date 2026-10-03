using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.InnovationGenomes;

/// <summary>An administrator corrects a genome; the corrected genome is approved.</summary>
public sealed class ReviseInnovationGenomeHandler(CastorDbContext db, CurrentUser currentUser, IClock clock)
{
    public async Task<InnovationGenomeResponse> HandleAsync(
        Guid genomeId,
        ReviseInnovationGenomeRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Guid adminId = currentUser.UserId;
        InnovationGenome genome = await db.InnovationGenomes.SingleOrDefaultAsync(candidate => candidate.Id == genomeId, cancellationToken)
            ?? throw new DomainException("The genome does not exist.", StatusCodes.Status404NotFound);

        IReadOnlyList<string> codes = request.ChallengeAreaCodes ?? [];
        List<ChallengeArea> areas = await db.ChallengeAreas.Where(area => codes.Contains(area.Code)).ToListAsync(cancellationToken);
        if (areas.Count != codes.Distinct().Count())
        {
            throw new DomainException("One of the challenge areas does not exist.");
        }

        var resources = RequiredResources.Describe(
            request.RequiredInstitutions ?? [],
            request.RequiredPeople ?? [],
            request.RequiredBudget,
            request.RequiredInfrastructure ?? []);
        genome.Revise(
            request.RootCauses ?? [],
            request.Mechanisms ?? [],
            request.TargetGroups ?? [],
            resources,
            request.Scale,
            areas,
            request.Summary,
            adminId,
            clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        string title = await db.Innovations.Where(innovation => innovation.Id == genome.InnovationId).Select(innovation => innovation.Title).SingleAsync(cancellationToken);
        return genome.ToResponse(title);
    }
}
