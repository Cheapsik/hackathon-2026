namespace Castor.Api.Domain;

/// <summary>
/// One message of the assistant chat next to a fit assessment (module VII). The chat belongs to the user who holds
/// it: everyone sees the card, only its author sees their conversation with the assistant (SPEC 6.5).
/// </summary>
public sealed class FitAssistantMessage
{
    /// <summary>The limit of what a user types.</summary>
    public const int MessageMaxLength = 2000;

    /// <summary>
    /// The stored text: placeholders like [TELEFON] are longer than what they replace, and the model's answer is cut
    /// here rather than failing the save.
    /// </summary>
    public const int TextMaxLength = 4000;

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

        if (trimmed.Length > MessageMaxLength)
        {
            throw new DomainException($"A message has at most {MessageMaxLength} characters.");
        }

        string anonymized = Anonymizer.Anonymize(trimmed);
        return Create(assessment, userId, AssistantRole.USER, Cut(anonymized), createdAt);
    }

    public static FitAssistantMessage FromAssistant(FitAssessment assessment, Guid userId, string text, DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(assessment);

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException("The assistant returned an empty answer.");
        }

        string trimmed = text.Trim();
        return Create(assessment, userId, AssistantRole.ASSISTANT, Cut(trimmed), createdAt);
    }

    private static string Cut(string text)
    {
        return text.Length <= TextMaxLength ? text : text[..(TextMaxLength - 1)] + "…";
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
