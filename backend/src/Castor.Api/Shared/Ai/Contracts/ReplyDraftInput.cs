namespace Castor.Api.Shared;

/// <summary>Input of the reply prompt: the anonymized report and what the platform proposed for it.</summary>
public sealed record ReplyDraftInput(
    string Problem,
    string? Municipality,
    IReadOnlyList<string> ChallengeAreas,
    IReadOnlyList<ReplyDraftMatch> Matches,
    string? Hybrid);
