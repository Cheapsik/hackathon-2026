using System.Collections.Concurrent;
using System.Reflection;

namespace Castor.Api.Shared;

/// <summary>
/// The instructions for the language model, kept as Markdown files in <c>Shared/Ai/Prompts/</c> and embedded in the
/// assembly, so a prompt is edited as text and never scattered through the code.
/// </summary>
public static class PromptTemplates
{
    public const string ClassifyProblemReport = "classify-problem-report";

    public const string RankInnovations = "rank-innovations";

    public const string ProposeHybrid = "propose-hybrid";

    public const string GenerateGenome = "generate-genome";

    private static readonly ConcurrentDictionary<string, string> Loaded = new(StringComparer.Ordinal);

    public static string Get(string name)
    {
        return Loaded.GetOrAdd(name, Read);
    }

    private static string Read(string name)
    {
        Assembly assembly = typeof(PromptTemplates).Assembly;
        string resourceName = $"Castor.Api.Shared.Ai.Prompts.{name}.md";

        using Stream stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"The prompt '{name}' is not embedded as {resourceName}.");
        using var reader = new StreamReader(stream);

        return reader.ReadToEnd();
    }
}
