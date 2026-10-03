using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>An administrator accepts or rejects a submitted idea, having read the experts' reviews.</summary>
public sealed class DecideIdeaHandler(CastorDbContext db, IdeaReaderFactory readers, IdeaViewQuery viewQuery, IClock clock)
{
    public async Task<IdeaResponse> HandleAsync(Guid ideaId, DecideIdeaRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!NamedEnum.TryParse(request.Decision, out IdeaStatus decision))
        {
            throw new DomainException("The decision is ACCEPTED or REJECTED.");
        }

        IdeaReader reader = await readers.CurrentAsync(cancellationToken);
        Idea idea = await db.Ideas
                .Include(candidate => candidate.CoAuthors)
                .SingleOrDefaultAsync(candidate => candidate.Id == ideaId, cancellationToken)
            ?? throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);

        idea.Decide(decision, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        IdeaView view = await viewQuery.OfAsync(idea, cancellationToken);
        return idea.ToResponse(view, reader);
    }
}
