namespace Castor.Api.Shared;

/// <summary>A proposed innovation as the reply prompt sees it.</summary>
public sealed record ReplyDraftMatch(
    string Title,
    string Justification);
