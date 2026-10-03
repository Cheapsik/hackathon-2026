namespace Castor.Api.Shared;

/// <summary>The idea card as text, anonymized, the fields it still lacks, the chat so far and the new message.</summary>
/// <param name="MissingFields">Field names as in <see cref="Idea.MissingForSubmission"/>.</param>
public sealed record IdeaAssistantInput(
    string Card,
    IReadOnlyList<string> MissingFields,
    IReadOnlyList<IdeaAssistantTurn> History,
    string Message);
