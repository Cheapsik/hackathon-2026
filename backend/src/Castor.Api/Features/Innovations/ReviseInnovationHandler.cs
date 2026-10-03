using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Innovations;

/// <summary>An administrator rewrites a card; the genome stays until it is recalculated.</summary>
public sealed class ReviseInnovationHandler(CastorDbContext db, IClock clock)
{
    public async Task<InnovationResponse> HandleAsync(Guid innovationId, ReviseInnovationRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!NamedEnum.TryParse(request.Stage, out InnovationStage stage))
        {
            throw new DomainException("Stage is IDEA, PROTOTYPE, TESTED or READY.");
        }

        Innovation innovation = await db.Innovations
                .Include(candidate => candidate.Genome)
                .SingleOrDefaultAsync(candidate => candidate.Id == innovationId, cancellationToken)
            ?? throw new DomainException("The innovation does not exist.", StatusCodes.Status404NotFound);

        var sections = new InnovationCardSections(request.Solution, request.Problems, request.TargetGroup, request.Beneficiaries, request.Evidence);
        var links = new InnovationLinks(request.CardUrl, request.VideoUrl, request.MaterialsZipUrl, request.CardPdfUrl, request.TermsUrl);
        innovation.Revise(request.Title, request.ShortDescription, request.Categories ?? [], sections, request.Organization, links, stage, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        return innovation.ToResponse();
    }
}
