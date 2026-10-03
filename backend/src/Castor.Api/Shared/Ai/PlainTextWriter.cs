namespace Castor.Api.Shared;

/// <summary>"Prościej" (SPEC 6.8): the language model rewrites a public description into short, simple sentences.</summary>
public sealed class PlainTextWriter(ILlmClient llm)
{
    public async Task<string> RewriteAsync(string title, string text, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(text);

        var input = new PlainTextInput(title, text);
        var prompt = new LlmPrompt(PromptTemplates.Get(PromptTemplates.RewritePlain), LlmJson.Serialize(input));
        string rewritten = (await llm.CompleteAsync(prompt, cancellationToken)).Trim();
        if (rewritten.Length == 0)
        {
            throw new InvalidOperationException("The language model returned an empty plain-language text.");
        }

        if (rewritten.Length > Innovation.PlainTextMaxLength)
        {
            rewritten = rewritten[..Innovation.PlainTextMaxLength].TrimEnd();
        }

        return rewritten;
    }
}
