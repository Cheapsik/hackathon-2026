namespace Castor.Api.Infrastructure;

/// <summary>
/// Sent to everyone who takes part in the conversation (<see cref="LiveHub.ConversationGroups"/>). It carries no text:
/// the listener reads the conversation again with its own access.
/// </summary>
public sealed record MessagePostedEvent(
    Guid ConversationId,
    Guid MessageId,
    string SenderRole,
    DateTimeOffset PostedAt);
