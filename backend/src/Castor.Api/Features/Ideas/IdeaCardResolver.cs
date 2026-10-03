using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>Finds what a card from the Kreator refers to — its challenge areas and starting innovation — and reads its stage.</summary>
public sealed class IdeaCardResolver(CastorDbContext db)
{
    public static InnovationStage ParseStage(string? stage)
    {
        if (string.IsNullOrWhiteSpace(stage))
        {
            return InnovationStage.IDEA;
        }

        if (!NamedEnum.TryParse(stage, out InnovationStage parsed))
        {
            throw new DomainException("Stage is IDEA, PROTOTYPE, TESTED or READY.");
        }

        return parsed;
    }

    public async Task<ResolvedIdeaCard> ResolveAsync(
        IReadOnlyList<string> challengeAreaCodes,
        Guid? startingInnovationId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(challengeAreaCodes);

        List<string> codes = [.. challengeAreaCodes.Distinct(StringComparer.Ordinal)];
        List<ChallengeArea> areas = await db.ChallengeAreas
            .AsNoTracking()
            .Where(area => codes.Contains(area.Code))
            .ToListAsync(cancellationToken);
        if (areas.Count != codes.Count)
        {
            throw new DomainException("One of the challenge areas does not exist.");
        }

        List<ChallengeArea> ordered = [.. areas.OrderBy(area => codes.IndexOf(area.Code))];
        if (startingInnovationId is not Guid innovationId)
        {
            return new ResolvedIdeaCard(ordered, null);
        }

        Innovation innovation = await db.Innovations
                .AsNoTracking()
                .SingleOrDefaultAsync(candidate => candidate.Id == innovationId, cancellationToken)
            ?? throw new DomainException("The starting innovation does not exist.");

        return new ResolvedIdeaCard(ordered, innovation);
    }
}
