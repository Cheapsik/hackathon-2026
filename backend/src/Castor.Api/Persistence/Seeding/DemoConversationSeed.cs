namespace Castor.Api.Persistence;

/// <summary>A question to the experts of <see cref="ChallengeArea"/>, or a partnership proposal about <see cref="Innovation"/>.</summary>
/// <param name="Innovation">The source key of a library innovation; only for a partnership.</param>
public sealed record DemoConversationSeed(
    string Initiator,
    int DaysAgo,
    string Subject,
    string? ChallengeArea,
    string? Innovation,
    List<DemoMessageSeed> Messages);
