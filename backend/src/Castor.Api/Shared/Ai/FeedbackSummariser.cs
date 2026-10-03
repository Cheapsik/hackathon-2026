namespace Castor.Api.Shared;

/// <summary>Turns every rating of an innovation into a short list of improvements for the author.</summary>
public sealed class FeedbackSummariser(ILlmClient llm)
{
    public async Task<IReadOnlyList<string>> SummariseAsync(
        string title,
        IReadOnlyList<Feedback> feedback,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentNullException.ThrowIfNull(feedback);

        if (feedback.Count == 0)
        {
            return [];
        }

        var input = new FeedbackSummaryInput(
            title,
            [.. feedback.Select(entry => new FeedbackBrief(
                entry.Stars,
                entry.WhatWorks is null ? null : Anonymizer.Anonymize(entry.WhatWorks),
                entry.WhatToImprove is null ? null : Anonymizer.Anonymize(entry.WhatToImprove)))]);
        var prompt = new LlmPrompt(PromptTemplates.Get(PromptTemplates.SummariseFeedback), LlmJson.Serialize(input));
        FeedbackSummaryResult result = await llm.CompleteJsonAsync<FeedbackSummaryResult>(prompt, cancellationToken);

        return [.. (result.Improvements ?? [])
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Distinct(StringComparer.Ordinal)
            .Take(8)];
    }
}
