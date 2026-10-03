namespace Castor.Api.Shared;

/// <param name="Instructions">The system part, read from a prompt file in <c>Shared/Ai/Prompts/</c>.</param>
/// <param name="Input">The user part: the anonymized text and the data the model works on.</param>
public sealed record LlmPrompt(string Instructions, string Input);
