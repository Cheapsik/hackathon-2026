using FeedbackEntry = Castor.Api.Domain.Feedback;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Feedback;

public sealed class WriteFeedbackHandler(CastorDbContext db, CurrentUser currentUser, IClock clock)
{
    public async Task<FeedbackResponse> HandleAsync(Guid innovationId, WriteFeedbackRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.Stars is null)
        {
            throw new DomainException("A rating needs stars.");
        }

        Innovation innovation = await db.Innovations.SingleOrDefaultAsync(candidate => candidate.Id == innovationId, cancellationToken)
            ?? throw new DomainException("The innovation does not exist.", StatusCodes.Status404NotFound);

        User author = await db.Users.SingleAsync(candidate => candidate.Id == currentUser.UserId, cancellationToken);
        FeedbackEntry? existing = await db.Feedback
            .SingleOrDefaultAsync(candidate => candidate.InnovationId == innovationId && candidate.AuthorId == author.Id, cancellationToken);

        DateTimeOffset now = clock.UtcNow;
        if (existing is null)
        {
            existing = FeedbackEntry.Write(innovation, author, request.Stars.Value, request.WhatWorks, request.WhatToImprove, request.Dictated, now);
            db.Feedback.Add(existing);
        }
        else
        {
            existing.Revise(request.Stars.Value, request.WhatWorks, request.WhatToImprove, request.Dictated, now);
        }

        await db.SaveChangesAsync(cancellationToken);
        return ToResponse(existing, author.Id);
    }

    internal static FeedbackResponse ToResponse(FeedbackEntry feedback, Guid readerId)
    {
        return new FeedbackResponse(
            feedback.Id,
            feedback.Stars,
            feedback.WhatWorks,
            feedback.WhatToImprove,
            feedback.Dictated,
            feedback.AuthorId == readerId,
            feedback.UpdatedAt);
    }
}
