using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>"Dołącz do istniejącego pomysłu": the user becomes a co-author instead of submitting a similar idea.</summary>
public sealed class JoinIdeaHandler(CastorDbContext db, IdeaReaderFactory readers, IdeaViewQuery viewQuery, IClock clock)
{
    public async Task<IdeaResponse> HandleAsync(Guid ideaId, CancellationToken cancellationToken)
    {
        IdeaReader reader = await readers.CurrentAsync(cancellationToken);
        Idea? idea = await db.Ideas
            .Include(candidate => candidate.CoAuthors)
            .SingleOrDefaultAsync(candidate => candidate.Id == ideaId, cancellationToken);

        if (idea is null || !idea.IsVisibleTo(reader.UserId, reader.IsAdmin))
        {
            throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);
        }

        idea.Join(reader.UserId, clock.UtcNow);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (PostgresErrors.IsUniqueViolation(exception))
        {
            throw new DomainException("You are already an author of this idea.", StatusCodes.Status409Conflict);
        }

        IdeaView view = await viewQuery.OfAsync(idea, cancellationToken);
        return idea.ToResponse(view, reader);
    }
}
