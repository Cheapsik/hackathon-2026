namespace Castor.Api.Shared;

/// <summary>
/// A language model behind an adapter chosen by <c>Llm:Provider</c>, so no code depends on one vendor. Text sent
/// here is already anonymized; the adapter logs duration and token counts, never the prompt.
/// </summary>
public interface ILlmClient
{
    Task<string> CompleteAsync(LlmPrompt prompt, CancellationToken cancellationToken);

    /// <summary>
    /// An answer that matches the JSON schema of <typeparamref name="TResult"/>. A provider without structured
    /// output gets the schema in the prompt; its answer is validated and asked for once more when it does not match.
    /// </summary>
    Task<TResult> CompleteJsonAsync<TResult>(LlmPrompt prompt, CancellationToken cancellationToken);
}
