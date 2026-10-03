namespace Castor.Api.Shared;

/// <summary>Configuration for the OpenAI Responses API adapter in the <c>Llm</c> section.</summary>
public sealed class OpenAiLlmOptions
{
    public const string Section = "Llm";

    public string Model { get; set; } = string.Empty;

    public string ApiKey { get; set; } = string.Empty;

    public string BaseUrl { get; set; } = "https://api.openai.com/v1/";

    public int MaxOutputTokens { get; set; } = 4096;

    public int TimeoutSeconds { get; set; } = 120;
}
