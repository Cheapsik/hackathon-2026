namespace Castor.Api.Features.Ideas;

internal static class IdeaConverter
{
    public static IdeaResponse ToResponse(this Idea idea, IdeaView view, IdeaReader reader)
    {
        ArgumentNullException.ThrowIfNull(view);
        ArgumentNullException.ThrowIfNull(reader);

        bool isAuthor = idea.IsAuthoredBy(reader.UserId);
        bool seesWork = isAuthor || reader.IsAdmin;

        List<IdeaChallengeAreaResponse> areas = [.. view.ChallengeAreas.Select(area => new IdeaChallengeAreaResponse(area.Code, area.Name))];
        List<IdeaInnovationResponse> fromHybridOf = [.. idea.FromHybridOf
            .Where(view.InnovationTitles.ContainsKey)
            .Select(id => new IdeaInnovationResponse(id, view.InnovationTitles[id]))];
        IdeaInnovationResponse? starting = idea.StartingInnovationId is Guid startingId && view.InnovationTitles.TryGetValue(startingId, out string? startingTitle)
            ? new IdeaInnovationResponse(startingId, startingTitle)
            : null;
        List<IdeaSimilarityResponse> similar = seesWork ? [.. idea.Similar.Select(ToSimilarityResponse)] : [];
        List<IdeaReviewResponse>? reviews = seesWork ? [.. view.Reviews.Select(review => ToReviewResponse(review, reader.UserId))] : null;
        IdeaReview? myReview = view.Reviews.FirstOrDefault(review => review.ExpertId == reader.UserId);
        IdeaReviewResponse? myReviewResponse = myReview is null ? null : ToReviewResponse(myReview, reader.UserId);
        List<IdeaGrantApplicationResponse> applications = seesWork
            ? [.. view.GrantApplications.Select(application => new IdeaGrantApplicationResponse(application.Id, application.GrantCallId, application.GrantCallTitle))]
            : [];

        string status = idea.Status.ToString();
        string stage = idea.Stage.ToString();
        bool canSubmit = isAuthor && idea.Status == IdeaStatus.DRAFT;
        bool canDecide = reader.IsAdmin && idea.Status == IdeaStatus.SUBMITTED;
        bool canConvert = reader.IsAdmin && idea.Status == IdeaStatus.ACCEPTED && view.InnovationId is null;
        bool canApply = isAuthor && idea.Status != IdeaStatus.REJECTED;

        return new IdeaResponse(
            idea.Id,
            status,
            idea.Title,
            areas,
            idea.ProblemIntensity,
            idea.ProblemFrequency,
            idea.ProblemScale,
            idea.Recipients,
            idea.OtherRecipients,
            idea.Solution,
            stage,
            idea.Supporters,
            idea.Opponents,
            idea.EmotionalValues,
            idea.FunctionalValues,
            idea.DifferenceNote,
            fromHybridOf,
            starting,
            similar,
            idea.SimilarCheckedAt,
            idea.HasCurrentSimilarity(),
            idea.MissingForSubmission(),
            idea.CoAuthors.Count,
            isAuthor,
            idea.IsEditableBy(reader.UserId),
            canSubmit,
            idea.AcceptsCoAuthor(reader.UserId),
            idea.IsReviewableBy(reader.ExpertChallengeAreaCodes),
            canDecide,
            canConvert,
            canApply,
            reviews,
            myReviewResponse,
            view.InnovationId,
            applications,
            idea.SubmittedAt,
            idea.DecidedAt,
            idea.CreatedAt,
            idea.UpdatedAt);
    }

    /// <param name="reviewedIds">Ideas the reader has reviewed as an expert.</param>
    public static IdeaSummaryResponse ToSummaryResponse(this Idea idea, Guid readerId, IReadOnlySet<Guid> reviewedIds)
    {
        ArgumentNullException.ThrowIfNull(reviewedIds);

        string status = idea.Status.ToString();
        string stage = idea.Stage.ToString();

        return new IdeaSummaryResponse(
            idea.Id,
            idea.Title,
            status,
            idea.ChallengeAreaCodes,
            stage,
            idea.IsAuthoredBy(readerId),
            reviewedIds.Contains(idea.Id),
            idea.SubmittedAt,
            idea.UpdatedAt);
    }

    public static IdeaAssistantMessageResponse ToResponse(this IdeaAssistantMessage message)
    {
        string role = message.Role.ToString();

        return new IdeaAssistantMessageResponse(message.Id, role, message.Text, message.CreatedAt);
    }

    private static IdeaSimilarityResponse ToSimilarityResponse(IdeaSimilarity similarity)
    {
        string kind = similarity.Kind.ToString();

        return new IdeaSimilarityResponse(kind, similarity.TargetId, similarity.Title, similarity.Score, similarity.Justification);
    }

    private static IdeaReviewResponse ToReviewResponse(IdeaReview review, Guid readerId)
    {
        string recommendation = review.Recommendation.ToString();
        bool mine = review.ExpertId == readerId;

        return new IdeaReviewResponse(review.Id, recommendation, review.Comment, mine, review.UpdatedAt);
    }
}
