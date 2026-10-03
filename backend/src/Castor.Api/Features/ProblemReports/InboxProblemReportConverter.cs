namespace Castor.Api.Features.ProblemReports;

internal static class InboxProblemReportConverter
{
    public static InboxProblemReportResponse ToInboxResponse(
        this ProblemReport report,
        ProblemReportView view,
        IReadOnlyList<SuggestedExpert> experts)
    {
        ProblemReportResponse reportResponse = report.ToResponse(view, showOriginal: true);
        string? urgency = report.Urgency?.ToString();
        List<SuggestedExpertResponse> expertResponses = [.. experts.Select(expert =>
            new SuggestedExpertResponse(expert.UserId, expert.Email, expert.SharedChallengeAreaCodes))];

        return new InboxProblemReportResponse(reportResponse, urgency, expertResponses, report.ReplyDraft, report.ReplyDraftUpdatedAt);
    }
}
