namespace Castor.Api.Shared;

/// <summary>
/// The application generator of the Kreator (SPEC 7 III): a draft answering the criteria of an open grant call from the
/// idea card. The card goes to the model anonymized; the draft is cut to the limits of an application.
/// </summary>
public sealed class GrantApplicationWriter(ILlmClient llm, ILogger<GrantApplicationWriter> logger)
{
    public async Task<GrantApplicationDraft> DraftAsync(Idea idea, GrantCall grantCall, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(idea);
        ArgumentNullException.ThrowIfNull(grantCall);

        string card = Anonymizer.Anonymize(idea.DescribeForMatching());
        var input = new GrantApplicationDraftInput(grantCall.Title, grantCall.Description, grantCall.Criteria, card);
        string inputJson = LlmJson.Serialize(input);
        string instructions = PromptTemplates.Get(PromptTemplates.DraftGrantApplication);
        var prompt = new LlmPrompt(instructions, inputJson);

        GrantApplicationDraftResult result = await llm.CompleteJsonAsync<GrantApplicationDraftResult>(prompt, cancellationToken);

        IReadOnlyList<string?> returned = result.Answers ?? [];
        if (returned.Count != grantCall.Criteria.Count)
        {
            logger.LogWarning(
                "The application draft of idea {IdeaId} for grant call {GrantCallId} answered {AnswerCount} of {CriteriaCount} criteria; the rest are left open.",
                idea.Id,
                grantCall.Id,
                returned.Count,
                grantCall.Criteria.Count);
        }

        List<string?> answers = [.. grantCall.Criteria.Select((_, index) => index < returned.Count ? Cut(returned[index], GrantApplicationAnswer.AnswerMaxLength) : null)];
        string title = Cut(result.Title, GrantApplication.TitleMaxLength) ?? idea.Title;
        string? summary = Cut(result.Summary, GrantApplication.SummaryMaxLength);

        return new GrantApplicationDraft(title, summary, answers);
    }

    private static string? Cut(string? text, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        string trimmed = text.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..(maxLength - 1)] + "…";
    }
}
