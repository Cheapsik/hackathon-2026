using System.Collections.Concurrent;
using Castor.Api.Shared;
using Microsoft.Extensions.Logging.Abstractions;

namespace Castor.Tests;

/// <summary>
/// The placeholder language model, which a test can make fail for one kind of answer, or whose answers it can
/// reshape. It records every structured prompt it gets.
/// </summary>
internal sealed class ScriptedLlmClient : ILlmClient
{
    private readonly PlaceholderLlmClient placeholder = new(NullLogger<PlaceholderLlmClient>.Instance);

    private readonly ConcurrentDictionary<Type, bool> failing = new();

    private readonly ConcurrentQueue<LlmPrompt> prompts = new();

    /// <summary>Changes an answer of the placeholder before the application gets it.</summary>
    public Func<LlmPrompt, object, object>? Reshape { get; set; }

    public IReadOnlyCollection<LlmPrompt> Prompts => prompts;

    /// <summary>Every answer of type <typeparamref name="TResult"/> fails, as an unreachable provider would.</summary>
    public void Fail<TResult>()
    {
        failing[typeof(TResult)] = true;
    }

    public void Recover()
    {
        failing.Clear();
    }

    public Task<string> CompleteAsync(LlmPrompt prompt, CancellationToken cancellationToken)
    {
        return placeholder.CompleteAsync(prompt, cancellationToken);
    }

    public async Task<TResult> CompleteJsonAsync<TResult>(LlmPrompt prompt, CancellationToken cancellationToken)
    {
        prompts.Enqueue(prompt);

        if (failing.ContainsKey(typeof(TResult)))
        {
            throw new HttpRequestException("The language model is unavailable.");
        }

        TResult result = await placeholder.CompleteJsonAsync<TResult>(prompt, cancellationToken);
        if (Reshape is null)
        {
            return result;
        }

        object reshaped = Reshape(prompt, result!);
        return (TResult)reshaped;
    }
}
