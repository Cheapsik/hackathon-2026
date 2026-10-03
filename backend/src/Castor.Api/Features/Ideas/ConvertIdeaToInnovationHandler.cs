using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>
/// An administrator turns an accepted idea into a user innovation; its genome is generated in the background, and its
/// authors answer the partnership threads about it.
/// </summary>
public sealed class ConvertIdeaToInnovationHandler(
    CastorDbContext db,
    IdeaReaderFactory readers,
    IdeaViewQuery viewQuery,
    BackgroundJobScheduler jobs,
    IClock clock)
{
    public async Task<IdeaResponse> HandleAsync(Guid ideaId, CancellationToken cancellationToken)
    {
        IdeaReader reader = await readers.CurrentAsync(cancellationToken);
        Idea idea = await db.Ideas
                .AsNoTracking()
                .Include(candidate => candidate.CoAuthors)
                .SingleOrDefaultAsync(candidate => candidate.Id == ideaId, cancellationToken)
            ?? throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);

        bool converted = await db.Innovations.AnyAsync(innovation => innovation.SourceIdeaId == ideaId, cancellationToken);
        if (converted)
        {
            throw new DomainException("The idea is already an innovation.", StatusCodes.Status409Conflict);
        }

        var innovation = Innovation.FromIdea(idea, clock.UtcNow);
        db.Innovations.Add(innovation);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (PostgresErrors.IsUniqueViolation(exception))
        {
            throw new DomainException("The idea is already an innovation.", StatusCodes.Status409Conflict);
        }

        await jobs.QueueAsync(BackgroundJobKind.GENERATE_GENOMES, cancellationToken);

        IdeaView view = await viewQuery.OfAsync(idea, cancellationToken);
        return idea.ToResponse(view, reader);
    }
}
