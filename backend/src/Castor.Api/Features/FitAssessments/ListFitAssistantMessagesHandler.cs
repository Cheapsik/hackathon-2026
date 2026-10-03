using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.FitAssessments;

/// <summary>The signed-in user's chat with the assistant of a card; other users' chats stay theirs.</summary>
public sealed class ListFitAssistantMessagesHandler(CastorDbContext db, CurrentUser currentUser)
{
    public async Task<IReadOnlyList<FitAssistantMessageResponse>> HandleAsync(
        Guid innovationId,
        Guid fitAssessmentId,
        CancellationToken cancellationToken)
    {
        Guid userId = currentUser.UserId;

        bool exists = await db.FitAssessments.AnyAsync(
            candidate => candidate.Id == fitAssessmentId && candidate.InnovationId == innovationId,
            cancellationToken);
        if (!exists)
        {
            throw new DomainException("The fit assessment does not exist.", StatusCodes.Status404NotFound);
        }

        List<FitAssistantMessage> messages = await db.FitAssistantMessages
            .AsNoTracking()
            .Where(message => message.FitAssessmentId == fitAssessmentId && message.UserId == userId)
            .OrderBy(message => message.CreatedAt)
            .ToListAsync(cancellationToken);

        return [.. messages.Select(message => message.ToResponse())];
    }
}
