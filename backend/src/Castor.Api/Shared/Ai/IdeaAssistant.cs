namespace Castor.Api.Shared;

/// <summary>
/// The assistant next to an idea card in the Kreator (SPEC 7 III): it asks about what the card lacks, helps sharpen it
/// and describes a visualization on request. It sees the card and the chat anonymized, like every user text.
/// </summary>
public sealed class IdeaAssistant(ILlmClient llm)
{
    /// <summary>The newest turns of the chat go to the model; older ones only cost tokens.</summary>
    private const int HistoryTurns = 12;

    public async Task<string> ReplyAsync(
        Idea idea,
        IReadOnlyList<IdeaAssistantMessage> history,
        IdeaAssistantMessage message,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(idea);
        ArgumentNullException.ThrowIfNull(history);
        ArgumentNullException.ThrowIfNull(message);

        List<IdeaAssistantTurn> turns = [.. history
            .TakeLast(HistoryTurns)
            .Select(turn => new IdeaAssistantTurn(turn.Role.ToString(), turn.Text))];

        string card = Anonymizer.Anonymize(idea.DescribeForMatching());
        List<string> missing = idea.MissingForSubmission();
        var input = new IdeaAssistantInput(card, missing, turns, message.Text);
        string inputJson = LlmJson.Serialize(input);
        string instructions = PromptTemplates.Get(PromptTemplates.IdeaAssistant);
        var prompt = new LlmPrompt(instructions, inputJson);

        return await llm.CompleteAsync(prompt, cancellationToken);
    }
}
