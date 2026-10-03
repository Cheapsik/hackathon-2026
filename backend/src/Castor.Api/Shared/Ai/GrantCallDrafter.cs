namespace Castor.Api.Shared;

/// <summary>"Szkic naboru" (module VI): a grant call drafted by the language model for a blank spot of the radar.</summary>
public sealed class GrantCallDrafter(ILlmClient llm)
{
    public async Task<GrantCallDraftResult> DraftAsync(
        ChallengeArea challengeArea,
        Municipality? municipality,
        int reports,
        IReadOnlyList<string> sampleProblems,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(challengeArea);
        ArgumentNullException.ThrowIfNull(sampleProblems);

        var input = new GrantCallDraftInput(
            challengeArea.Name,
            challengeArea.Definition,
            municipality?.QualifiedName,
            reports,
            sampleProblems);
        string inputJson = LlmJson.Serialize(input);
        string instructions = PromptTemplates.Get(PromptTemplates.DraftGrantCall);
        var prompt = new LlmPrompt(instructions, inputJson);

        GrantCallDraftResult result = await llm.CompleteJsonAsync<GrantCallDraftResult>(prompt, cancellationToken);
        if (string.IsNullOrWhiteSpace(result.Title))
        {
            throw new InvalidOperationException("The language model returned a grant call draft without a title.");
        }

        return result;
    }
}
