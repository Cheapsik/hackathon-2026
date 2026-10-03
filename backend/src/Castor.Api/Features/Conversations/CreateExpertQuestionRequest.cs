namespace Castor.Api.Features.Conversations;

/// <param name="ChallengeAreaCode">The area whose experts answer.</param>
/// <param name="Text">The question itself — the first message.</param>
public sealed record CreateExpertQuestionRequest(string? ChallengeAreaCode, string? Subject, string? Text);
