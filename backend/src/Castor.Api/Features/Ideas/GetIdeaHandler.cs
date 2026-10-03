using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>One idea: a draft for its authors and administrators, a submitted one for every signed-in user.</summary>
public sealed class GetIdeaHandler(CastorDbContext db, IdeaReaderFactory readers, IdeaViewQuery viewQuery)
{
    public async Task<IdeaResponse> HandleAsync(Guid ideaId, CancellationToken cancellationToken)
    {
        IdeaReader reader = await readers.CurrentAsync(cancellationToken);
        Idea? idea = await db.Ideas
            .AsNoTracking()
            .Include(candidate => candidate.CoAuthors)
            .SingleOrDefaultAsync(candidate => candidate.Id == ideaId, cancellationToken);

        if (idea is null || !idea.IsVisibleTo(reader.UserId, reader.IsAdmin))
        {
            throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);
        }

        IdeaView view = await viewQuery.OfAsync(idea, cancellationToken);
        return idea.ToResponse(view, reader);
    }
}
