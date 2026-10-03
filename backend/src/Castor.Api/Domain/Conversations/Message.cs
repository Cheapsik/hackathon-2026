namespace Castor.Api.Domain;

/// <summary>One message of a conversation. It is written through <see cref="Conversation.Post"/>, never alone.</summary>
public sealed class Message
{
    /// <summary>The same as a report's reply draft, which is sent as a message.</summary>
    public const int TextMaxLength = ProblemReport.ReplyDraftMaxLength;

    private Message()
    {
    }

    public Guid Id { get; private set; }

    public Guid ConversationId { get; private set; }

    /// <summary>Null for a visitor who wrote with the report's tracking code.</summary>
    public Guid? AuthorId { get; private set; }

    public SenderRole SenderRole { get; private set; }

    public string Text { get; private set; } = null!;

    public DateTimeOffset PostedAt { get; private set; }

    /// <summary>
    /// Whether the reader wrote it on the side they write on now. Two administrators are different authors; a visitor
    /// with the tracking code is the author of every message written without an account.
    /// </summary>
    public bool IsWrittenBy(Guid? userId, SenderRole senderRole)
    {
        return SenderRole == senderRole && AuthorId == userId;
    }

    internal static Message Write(Conversation conversation, SenderRole senderRole, Guid? authorId, string? text, DateTimeOffset postedAt)
    {
        ArgumentNullException.ThrowIfNull(conversation);

        if (authorId == Guid.Empty)
        {
            throw new InvalidOperationException("The author id of a new message is empty.");
        }

        string trimmed = text?.Trim() ?? string.Empty;
        if (trimmed.Length == 0)
        {
            throw new DomainException("Write a message.");
        }

        if (trimmed.Length > TextMaxLength)
        {
            throw new DomainException($"A message has at most {TextMaxLength} characters.");
        }

        return new Message
        {
            Id = Guid.CreateVersion7(),
            ConversationId = conversation.Id,
            AuthorId = authorId,
            SenderRole = senderRole,
            Text = trimmed,
            PostedAt = postedAt,
        };
    }
}
