namespace Castor.Api.Domain;

/// <summary>
/// One message of the assistant chat next to a fit assessment (module VII). The chat belongs to the user who holds
/// it: everyone sees the card, only its author sees their conversation with the assistant (SPEC 6.5).
/// </summary>
public sealed class FitAssistantMessage
{
    public const int TextMaxLength = 2000;

    private FitAssistantMessage()
    {
    }

    public Guid Id { get; private set; }

    public Guid FitAssessmentId { get; private set; }

    public Guid UserId { get; private set; }

    public AssistantRole Role { get; private set; }

    /// <summary>A user's message is anonymized like a report: it goes to the language model.</summary>
    public string Text { get; private set; } = null!;

    public DateTimeOffset CreatedAt { get; private set; }

    public static FitAssistantMessage FromUser(FitAssessment assessment, Guid userId, string? text, DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(assessment);

        string trimmed = text?.Trim() ?? string.Empty;
        if (trimmed.Length == 0)
        {
            throw new DomainException("Write a message to the assistant.");
        }

        string anonymized = Anonymizer.Anonymize(trimmed);
        if (anonymized.Length > TextMaxLength)
        {
            throw new DomainException($"A message has at most {TextMaxLength} characters.");
        }

        return Create(assessment, userId, AssistantRole.USER, anonymized, createdAt);
    }

    public static FitAssistantMessage FromAssistant(FitAssessment assessment, Guid userId, string text, DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(assessment);

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException("The assistant returned an empty answer.");
        }

        return Create(assessment, userId, AssistantRole.ASSISTANT, text.Trim(), createdAt);
    }

    private static FitAssistantMessage Create(
        FitAssessment assessment,
        Guid userId,
        AssistantRole role,
        string text,
        DateTimeOffset createdAt)
    {
        if (userId == Guid.Empty)
        {
            throw new InvalidOperationException("An assistant message needs the id of the user holding the chat.");
        }

        return new FitAssistantMessage
        {
            Id = Guid.CreateVersion7(),
            FitAssessmentId = assessment.Id,
            UserId = userId,
            Role = role,
            Text = text,
            CreatedAt = createdAt,
        };
    }
}
