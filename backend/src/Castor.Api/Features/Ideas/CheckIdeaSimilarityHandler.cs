using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>"Sprawdź podobne": the authors run the duplicate check on the card as it is now.</summary>
public sealed class CheckIdeaSimilarityHandler(
    CastorDbContext db,
    IdeaReaderFactory readers,
    DuplicateChecker checker,
    IdeaViewQuery viewQuery,
    IClock clock)
{
    public async Task<IdeaResponse> HandleAsync(Guid ideaId, CancellationToken cancellationToken)
    {
        IdeaReader reader = await readers.CurrentAsync(cancellationToken);
        Idea idea = await db.Ideas
                .Include(candidate => candidate.CoAuthors)
                .SingleOrDefaultAsync(candidate => candidate.Id == ideaId, cancellationToken)
            ?? throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);

        if (!idea.IsEditableBy(reader.UserId))
        {
            throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);
        }

        IReadOnlyList<IdeaSimilarity> similar = await checker.CheckAsync(idea, cancellationToken);
        idea.RecordSimilarity(similar, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        IdeaView view = await viewQuery.OfAsync(idea, cancellationToken);
        return idea.ToResponse(view, reader);
    }
}
