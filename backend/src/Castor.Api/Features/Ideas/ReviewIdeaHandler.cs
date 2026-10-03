using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Ideas;

/// <summary>An expert of the idea's areas writes or changes their review while the idea waits for a decision.</summary>
public sealed class ReviewIdeaHandler(CastorDbContext db, IdeaReaderFactory readers, IdeaViewQuery viewQuery, IClock clock)
{
    public async Task<IdeaResponse> HandleAsync(Guid ideaId, ReviewIdeaRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!NamedEnum.TryParse(request.Recommendation, out IdeaReviewRecommendation recommendation))
        {
            throw new DomainException("Recommendation is DEVELOP, REVISE or DECLINE.");
        }

        IdeaReader reader = await readers.CurrentAsync(cancellationToken);
        Idea? idea = await db.Ideas
            .AsNoTracking()
            .Include(candidate => candidate.CoAuthors)
            .SingleOrDefaultAsync(candidate => candidate.Id == ideaId, cancellationToken);

        if (idea is null || !idea.IsVisibleTo(reader.UserId, reader.IsAdmin))
        {
            throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);
        }

        DateTimeOffset now = clock.UtcNow;
        IdeaReview? review = await db.IdeaReviews
            .SingleOrDefaultAsync(candidate => candidate.IdeaId == ideaId && candidate.ExpertId == reader.UserId, cancellationToken);
        if (review is null)
        {
            review = IdeaReview.Write(idea, reader.UserId, reader.ExpertChallengeAreaCodes, recommendation, request.Comment, now);
            db.IdeaReviews.Add(review);
        }
        else
        {
            review.Revise(idea, reader.ExpertChallengeAreaCodes, recommendation, request.Comment, now);
        }

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (PostgresErrors.IsUniqueViolation(exception))
        {
            throw new DomainException("Your review was saved at the same time from elsewhere; reload the idea.", StatusCodes.Status409Conflict);
        }

        IdeaView view = await viewQuery.OfAsync(idea, cancellationToken);
        return idea.ToResponse(view, reader);
    }
}
