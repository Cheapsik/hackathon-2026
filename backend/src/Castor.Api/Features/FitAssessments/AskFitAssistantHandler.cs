using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.FitAssessments;

/// <summary>A message to the assistant of a card; the chat belongs to the user who holds it (SPEC 6.5).</summary>
public sealed class AskFitAssistantHandler(CastorDbContext db, CurrentUser currentUser, FitAssistant assistant, IClock clock)
{
    /// <returns>The user's whole chat with the assistant of this card, oldest first.</returns>
    public async Task<IReadOnlyList<FitAssistantMessageResponse>> HandleAsync(
        Guid innovationId,
        Guid fitAssessmentId,
        AskFitAssistantRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Guid userId = currentUser.UserId;
        FitAssessment assessment = await db.FitAssessments
                .Include(candidate => candidate.Innovation)
                .Include(candidate => candidate.Municipality)
                .SingleOrDefaultAsync(
                    candidate => candidate.Id == fitAssessmentId && candidate.InnovationId == innovationId,
                    cancellationToken)
            ?? throw new DomainException("The fit assessment does not exist.", StatusCodes.Status404NotFound);

        List<FitAssistantMessage> history = await db.FitAssistantMessages
            .Where(message => message.FitAssessmentId == assessment.Id && message.UserId == userId)
            .OrderBy(message => message.CreatedAt)
            .ToListAsync(cancellationToken);

        var question = FitAssistantMessage.FromUser(assessment, userId, request.Message, clock.UtcNow);
        string reply = await assistant.ReplyAsync(assessment, history, question, cancellationToken);
        var answer = FitAssistantMessage.FromAssistant(assessment, userId, reply, clock.UtcNow);

        db.FitAssistantMessages.Add(question);
        db.FitAssistantMessages.Add(answer);
        await db.SaveChangesAsync(cancellationToken);

        history.Add(question);
        history.Add(answer);
        return [.. history.Select(message => message.ToResponse())];
    }
}
