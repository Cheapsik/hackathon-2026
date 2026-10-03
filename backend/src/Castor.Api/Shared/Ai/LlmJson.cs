using System.Text.Json;

namespace Castor.Api.Shared;

/// <summary>
/// One JSON shape for everything exchanged with a language model — camelCase, as the prompts describe it — so the
/// pipelines that write an input and the adapters that read it agree.
/// </summary>
public static class LlmJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static string Serialize<TValue>(TValue value)
    {
        return JsonSerializer.Serialize(value, Options);
    }

    public static TValue Deserialize<TValue>(string json)
    {
        return JsonSerializer.Deserialize<TValue>(json, Options)
            ?? throw new InvalidOperationException($"The language model returned no {typeof(TValue).Name}.");
    }
}
