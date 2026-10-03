using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Conversations;

/// <summary>
/// The signed-in user's conversations with at least one message, latest first: those they started or whose report is
/// theirs, for an expert also those of their areas, for an administrator all of them.
/// </summary>
public sealed class ListConversationsHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    ExpertChallengeAreasQuery expertAreasQuery)
{
    private const int Limit = 200;

    public async Task<IReadOnlyList<ConversationSummaryResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        Guid userId = currentUser.UserId;
        string[] expertAreas = await expertAreasQuery.OfAsync(userId, cancellationToken);
        var reader = new ConversationReader(userId, currentUser.IsAdmin, expertAreas, TrackingCode: null);

        List<Conversation> conversations = await db.Conversations
            .AsNoTracking()
            .Include(conversation => conversation.ProblemReport)
            .Include(conversation => conversation.ChallengeArea)
            .Include(conversation => conversation.Innovation)
            .Where(Conversation.VisibleTo(reader))
            .Where(conversation => conversation.LastMessageAt != null)
            .OrderByDescending(conversation => conversation.LastMessageAt)
            .Take(Limit)
            .ToListAsync(cancellationToken);

        return [.. conversations.Select(conversation => conversation.ToSummaryResponse())];
    }
}
