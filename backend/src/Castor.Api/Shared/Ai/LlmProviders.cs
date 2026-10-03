namespace Castor.Api.Shared;

/// <summary>The values of <c>Llm:Provider</c> the application knows. Any other value stops the start-up.</summary>
public static class LlmProviders
{
    /// <summary>OpenAI Responses API with structured outputs for JSON contracts.</summary>
    public const string OpenAi = "openai";

    /// <summary>
    /// No external service: deterministic answers built from the input, so every flow works end to end before a real
    /// provider is chosen (docs/TODO.md). Its results are plausible, not intelligent.
    /// </summary>
    public const string Placeholder = "placeholder";
}
