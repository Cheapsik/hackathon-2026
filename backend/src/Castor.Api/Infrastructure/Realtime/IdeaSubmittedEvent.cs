namespace Castor.Api.Infrastructure;

/// <summary>
/// Sent to administrators and experts of the idea's areas when an idea is submitted. It carries no text: the listener
/// reads the idea again with its own access.
/// </summary>
public sealed record IdeaSubmittedEvent(
    Guid IdeaId,
    IReadOnlyList<string> ChallengeAreaCodes,
    DateTimeOffset SubmittedAt);
