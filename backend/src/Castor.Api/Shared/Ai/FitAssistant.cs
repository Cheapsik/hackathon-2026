namespace Castor.Api.Shared;

/// <summary>
/// The assistant next to a fit assessment (module VII): it helps fit the innovation to the service a given institution
/// can run. It sees the card, the user's chat so far and the new message — anonymized, like every user text.
/// </summary>
public sealed class FitAssistant(ILlmClient llm)
{
    /// <summary>The newest turns of the chat go to the model; older ones only cost tokens.</summary>
    private const int HistoryTurns = 12;

    public async Task<string> ReplyAsync(
        FitAssessment assessment,
        IReadOnlyList<FitAssistantMessage> history,
        FitAssistantMessage message,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(assessment);
        ArgumentNullException.ThrowIfNull(history);
        ArgumentNullException.ThrowIfNull(message);

        List<FitAssistantTurn> turns = [.. history
            .TakeLast(HistoryTurns)
            .Select(turn => new FitAssistantTurn(turn.Role.ToString(), turn.Text))];

        string fit = assessment.Fit.ToString();
        var input = new FitAssistantInput(
            assessment.Innovation.Title,
            assessment.Municipality.QualifiedName,
            fit,
            assessment.Summary,
            assessment.ToAdapt,
            assessment.Missing,
            assessment.ServiceProvider,
            assessment.ServiceForm,
            turns,
            message.Text);
        string inputJson = LlmJson.Serialize(input);
        string instructions = PromptTemplates.Get(PromptTemplates.FitAssistant);
        var prompt = new LlmPrompt(instructions, inputJson);

        return await llm.CompleteAsync(prompt, cancellationToken);
    }
}
