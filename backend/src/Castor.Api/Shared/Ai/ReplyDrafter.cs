namespace Castor.Api.Shared;

/// <summary>
/// The draft of the administrators' reply to a report (module VI, "szkic odpowiedzi do edycji"). The administrator edits
/// it; it is sent from the report's thread (module V). Only anonymized text reaches the model.
/// </summary>
public sealed class ReplyDrafter(ILlmClient llm)
{
    public async Task<string> DraftAsync(
        ProblemReport report,
        IReadOnlyList<ChallengeArea> challengeAreas,
        IReadOnlyList<MatchResult> matches,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(report);
        ArgumentNullException.ThrowIfNull(challengeAreas);
        ArgumentNullException.ThrowIfNull(matches);

        List<ReplyDraftMatch> proposed = [.. matches
            .Where(match => match.Kind == MatchKind.MATCH && match.Innovation is not null)
            .Select(match => new ReplyDraftMatch(match.Innovation!.Title, match.Justification))];
        string? hybrid = matches.FirstOrDefault(match => match.Kind == MatchKind.HYBRID)?.HybridName;

        string problem = report.DescribeForMatching();
        List<string> areaNames = [.. challengeAreas.Select(area => area.Name)];
        var input = new ReplyDraftInput(problem, report.Municipality?.QualifiedName, areaNames, proposed, hybrid);
        string inputJson = LlmJson.Serialize(input);
        string instructions = PromptTemplates.Get(PromptTemplates.DraftReply);
        var prompt = new LlmPrompt(instructions, inputJson);

        return await llm.CompleteAsync(prompt, cancellationToken);
    }
}
