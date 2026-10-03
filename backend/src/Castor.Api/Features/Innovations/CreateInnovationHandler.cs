namespace Castor.Api.Features.Innovations;

/// <summary>An administrator enters an innovation by hand; its genome is generated in the background.</summary>
public sealed class CreateInnovationHandler(CastorDbContext db, BackgroundJobScheduler jobs, IClock clock)
{
    public async Task<InnovationResponse> HandleAsync(CreateInnovationRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!NamedEnum.TryParse(request.Stage, out InnovationStage stage))
        {
            throw new DomainException("Stage is IDEA, PROTOTYPE, TESTED or READY.");
        }

        var sections = new InnovationCardSections(request.Solution, request.Problems, request.TargetGroup, request.Beneficiaries, request.Evidence);
        var links = new InnovationLinks(request.CardUrl, request.VideoUrl, request.MaterialsZipUrl, request.CardPdfUrl, request.TermsUrl);
        var innovation = Innovation.Create(
            request.Title,
            request.ShortDescription,
            request.Categories ?? [],
            sections,
            request.Organization,
            links,
            stage,
            clock.UtcNow);
        db.Innovations.Add(innovation);
        await db.SaveChangesAsync(cancellationToken);

        await jobs.QueueAsync(BackgroundJobKind.GENERATE_GENOMES, cancellationToken);

        return innovation.ToResponse();
    }
}
