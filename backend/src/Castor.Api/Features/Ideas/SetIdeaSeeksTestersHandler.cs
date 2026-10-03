using Castor.Api.Features.Feedback;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

public sealed class SetIdeaSeeksTestersHandler(CastorDbContext db, CurrentUser currentUser, IdeaReaderFactory readers, IdeaViewQuery views, IClock clock)
{
    public async Task<IdeaResponse> HandleAsync(Guid ideaId, SetSeeksTestersRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        IdeaReader reader = await readers.CurrentAsync(cancellationToken);
        Idea idea = await db.Ideas.Include(candidate => candidate.CoAuthors)
                .SingleOrDefaultAsync(candidate => candidate.Id == ideaId, cancellationToken)
            ?? throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);

        if (!idea.IsVisibleTo(reader.UserId, reader.IsAdmin))
        {
            throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);
        }

        idea.SetSeeksTesters(currentUser.UserId, request.SeeksTesters, clock.UtcNow, asAdmin: reader.IsAdmin);
        await db.SaveChangesAsync(cancellationToken);

        IdeaView view = await views.OfAsync(idea, cancellationToken);
        return idea.ToResponse(view, reader);
    }
}
