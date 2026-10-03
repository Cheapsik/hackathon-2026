using FeedbackEntry = Castor.Api.Domain.Feedback;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Feedback;

public sealed class ListFeedbackHandler(CastorDbContext db, CurrentUser currentUser)
{
    public async Task<IReadOnlyList<FeedbackResponse>> HandleAsync(Guid innovationId, CancellationToken cancellationToken)
    {
        Innovation innovation = await db.Innovations.AsNoTracking().SingleOrDefaultAsync(candidate => candidate.Id == innovationId, cancellationToken)
            ?? throw new DomainException("The innovation does not exist.", StatusCodes.Status404NotFound);

        Guid userId = currentUser.UserId;
        bool canManage = await InnovationTeamAccess.CanManageAsync(db, innovation, userId, currentUser.IsAdmin, cancellationToken);

        IQueryable<FeedbackEntry> query = db.Feedback.AsNoTracking().Where(feedback => feedback.InnovationId == innovationId);
        if (!canManage)
        {
            query = query.Where(feedback => feedback.AuthorId == userId);
        }

        List<FeedbackEntry> found = await query.OrderByDescending(feedback => feedback.UpdatedAt).ToListAsync(cancellationToken);
        return [.. found.Select(feedback => WriteFeedbackHandler.ToResponse(feedback, userId))];
    }
}
