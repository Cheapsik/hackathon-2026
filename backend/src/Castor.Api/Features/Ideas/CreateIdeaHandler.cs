namespace Castor.Api.Features.Ideas;

/// <summary>A new idea card starts as a draft that only its authors see.</summary>
public sealed class CreateIdeaHandler(
    CastorDbContext db,
    IdeaReaderFactory readers,
    IdeaCardResolver resolver,
    IdeaViewQuery viewQuery,
    IClock clock)
{
    public async Task<IdeaResponse> HandleAsync(CreateIdeaRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        IdeaReader reader = await readers.CurrentAsync(cancellationToken);
        InnovationStage stage = IdeaCardResolver.ParseStage(request.Stage);
        ResolvedIdeaCard card = await resolver.ResolveAsync(request.ChallengeAreaCodes ?? [], request.StartingInnovationId, cancellationToken);
        var canvas = new IdeaCanvas(
            request.Title,
            request.ProblemIntensity,
            request.ProblemFrequency,
            request.ProblemScale,
            request.Recipients ?? [],
            request.OtherRecipients,
            request.Solution,
            stage,
            request.Supporters,
            request.Opponents,
            request.EmotionalValues ?? [],
            request.FunctionalValues ?? [],
            request.DifferenceNote);

        var idea = Idea.Draft(reader.UserId, canvas, card.ChallengeAreas, card.StartingInnovation, clock.UtcNow);
        db.Ideas.Add(idea);
        await db.SaveChangesAsync(cancellationToken);

        IdeaView view = await viewQuery.OfAsync(idea, cancellationToken);
        return idea.ToResponse(view, reader);
    }
}
