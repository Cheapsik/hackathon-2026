using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>
/// "Wyślij": the draft goes to ROPS and the experts of its areas. The duplicate check runs first unless it already read
/// the card as it is, so every submitted idea has been compared with the library and other ideas (SPEC 6.6).
/// </summary>
public sealed class SubmitIdeaHandler(
    CastorDbContext db,
    IdeaReaderFactory readers,
    DuplicateChecker checker,
    IdeaViewQuery viewQuery,
    IHubContext<LiveHub> hub,
    IClock clock)
{
    public async Task<IdeaResponse> HandleAsync(Guid ideaId, CancellationToken cancellationToken)
    {
        IdeaReader reader = await readers.CurrentAsync(cancellationToken);
        Idea idea = await db.Ideas
                .Include(candidate => candidate.CoAuthors)
                .SingleOrDefaultAsync(candidate => candidate.Id == ideaId, cancellationToken)
            ?? throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);

        // Submitting checks the card first, so a check is not paid for a card that cannot be submitted yet.
        idea.Submit(reader.UserId, clock.UtcNow);
        if (!idea.HasCurrentSimilarity())
        {
            IReadOnlyList<IdeaSimilarity> similar = await checker.CheckAsync(idea, cancellationToken);
            idea.RecordSimilarity(similar, clock.UtcNow);
        }

        await db.SaveChangesAsync(cancellationToken);

        DateTimeOffset submittedAt = idea.SubmittedAt
            ?? throw new InvalidOperationException($"Idea {idea.Id} was submitted without a date.");
        List<string> groups = [LiveHub.AdminsGroup, .. idea.ChallengeAreaCodes.Select(LiveHub.ExpertsGroup)];
        var submitted = new IdeaSubmittedEvent(idea.Id, idea.ChallengeAreaCodes, submittedAt);
        await hub.Clients.Groups(groups).SendAsync(LiveEvents.IdeaSubmitted, submitted, cancellationToken);

        IdeaView view = await viewQuery.OfAsync(idea, cancellationToken);
        return idea.ToResponse(view, reader);
    }
}
