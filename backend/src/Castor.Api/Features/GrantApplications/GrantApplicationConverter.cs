namespace Castor.Api.Features.GrantApplications;

internal static class GrantApplicationConverter
{
    public static GrantApplicationResponse ToResponse(this GrantApplication application, Idea idea, GrantCall grantCall, Guid readerId)
    {
        ArgumentNullException.ThrowIfNull(idea);
        ArgumentNullException.ThrowIfNull(grantCall);

        List<GrantApplicationAnswerResponse> answers = [.. application.Answers.Select(answer => new GrantApplicationAnswerResponse(answer.Criterion, answer.Answer))];
        bool canEdit = idea.IsAuthoredBy(readerId);

        return new GrantApplicationResponse(
            application.Id,
            idea.Id,
            idea.Title,
            grantCall.Id,
            grantCall.Title,
            grantCall.IsOpen,
            application.Title,
            application.Summary,
            answers,
            canEdit,
            application.CreatedAt,
            application.UpdatedAt);
    }

    public static GrantApplicationSummaryResponse ToSummaryResponse(this GrantApplication application, string ideaTitle)
    {
        int answered = application.Answers.Count(answer => answer.Answer is not null);

        return new GrantApplicationSummaryResponse(
            application.Id,
            application.IdeaId,
            ideaTitle,
            application.Title,
            answered,
            application.Answers.Count,
            application.UpdatedAt);
    }
}
