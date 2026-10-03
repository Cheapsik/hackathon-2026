namespace Castor.Api.Features.Conversations;

internal static class ConversationConverter
{
    /// <param name="messages">Oldest first.</param>
    /// <param name="senderRole">The side the reader writes on.</param>
    public static ConversationResponse ToResponse(
        this Conversation conversation,
        IReadOnlyList<Message> messages,
        Guid? readerId,
        SenderRole senderRole)
    {
        ArgumentNullException.ThrowIfNull(messages);

        string kind = conversation.Kind.ToString();
        ConversationChallengeAreaResponse? area = conversation.ChallengeArea is null
            ? null
            : new ConversationChallengeAreaResponse(conversation.ChallengeArea.Code, conversation.ChallengeArea.Name);
        ConversationInnovationResponse? innovation = conversation.Innovation is null
            ? null
            : new ConversationInnovationResponse(conversation.Innovation.Id, conversation.Innovation.Title);
        ConversationProblemReportResponse? report = conversation.ProblemReport is null ? null : ToReportResponse(conversation.ProblemReport);
        List<MessageResponse> messageResponses = [.. messages.Select(message => ToMessageResponse(message, readerId, senderRole))];
        string role = senderRole.ToString();
        bool acceptsMessages = conversation.AcceptsMessages();

        return new ConversationResponse(
            conversation.Id,
            kind,
            conversation.Subject,
            area,
            innovation,
            report,
            role,
            acceptsMessages,
            messageResponses,
            conversation.CreatedAt);
    }

    public static ConversationSummaryResponse ToSummaryResponse(this Conversation conversation)
    {
        string kind = conversation.Kind.ToString();
        string? trackingCode = conversation.ProblemReport is null ? null : TrackingCode.Format(conversation.ProblemReport.TrackingCode);
        string? reportStatus = conversation.ProblemReport?.Status.ToString();

        return new ConversationSummaryResponse(
            conversation.Id,
            kind,
            conversation.Subject,
            conversation.ChallengeArea?.Name,
            conversation.Innovation?.Title,
            trackingCode,
            reportStatus,
            conversation.LastMessageAt,
            conversation.CreatedAt);
    }

    public static MessagePostedEvent ToPostedEvent(this Message message)
    {
        string senderRole = message.SenderRole.ToString();

        return new MessagePostedEvent(message.ConversationId, message.Id, senderRole, message.PostedAt);
    }

    private static ConversationProblemReportResponse ToReportResponse(ProblemReport report)
    {
        string trackingCode = TrackingCode.Format(report.TrackingCode);
        string status = report.Status.ToString();

        return new ConversationProblemReportResponse(report.Id, trackingCode, status, report.Description, report.ChallengeAreaCodes);
    }

    private static MessageResponse ToMessageResponse(Message message, Guid? readerId, SenderRole senderRole)
    {
        string role = message.SenderRole.ToString();
        bool mine = message.IsWrittenBy(readerId, senderRole);

        return new MessageResponse(message.Id, role, mine, message.Text, message.PostedAt);
    }
}
