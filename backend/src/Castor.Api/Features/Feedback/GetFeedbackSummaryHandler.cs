using FeedbackEntry = Castor.Api.Domain.Feedback;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Feedback;

public sealed class GetFeedbackSummaryHandler(CastorDbContext db, CurrentUser currentUser, FeedbackSummariser summariser)
{
    public async Task<FeedbackSummaryResponse> HandleAsync(Guid innovationId, CancellationToken cancellationToken)
    {
        Innovation innovation = await db.Innovations.AsNoTracking().SingleOrDefaultAsync(candidate => candidate.Id == innovationId, cancellationToken)
            ?? throw new DomainException("The innovation does not exist.", StatusCodes.Status404NotFound);

        if (!await InnovationTeamAccess.CanManageAsync(db, innovation, currentUser.UserId, currentUser.IsAdmin, cancellationToken))
        {
            throw new DomainException("The summary is only for the innovation's team and ROPS.", StatusCodes.Status403Forbidden);
        }

        List<FeedbackEntry> feedback = await db.Feedback.AsNoTracking()
            .Where(entry => entry.InnovationId == innovationId)
            .OrderBy(entry => entry.CreatedAt)
            .ToListAsync(cancellationToken);

        IReadOnlyList<string> improvements = await summariser.SummariseAsync(innovation.Title, feedback, cancellationToken);
        double average = feedback.Count == 0 ? 0 : feedback.Average(entry => entry.Stars);

        return new FeedbackSummaryResponse(
            innovation.Id,
            innovation.Title,
            feedback.Count,
            Math.Round(average, 1, MidpointRounding.AwayFromZero),
            improvements);
    }
}
