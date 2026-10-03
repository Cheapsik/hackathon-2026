using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>The authors rewrite the card until an administrator decides on it.</summary>
public sealed class ReviseIdeaHandler(
    CastorDbContext db,
    IdeaReaderFactory readers,
    IdeaCardResolver resolver,
    IdeaViewQuery viewQuery,
    IClock clock)
{
    public async Task<IdeaResponse> HandleAsync(Guid ideaId, ReviseIdeaRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        IdeaReader reader = await readers.CurrentAsync(cancellationToken);
        Idea idea = await db.Ideas
                .Include(candidate => candidate.CoAuthors)
                .SingleOrDefaultAsync(candidate => candidate.Id == ideaId, cancellationToken)
            ?? throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);

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

        idea.Revise(reader.UserId, canvas, card.ChallengeAreas, card.StartingInnovation, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        IdeaView view = await viewQuery.OfAsync(idea, cancellationToken);
        return idea.ToResponse(view, reader);
    }
}
