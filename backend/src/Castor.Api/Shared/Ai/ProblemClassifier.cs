namespace Castor.Api.Shared;

/// <summary>
/// Step 1 of matching (SPEC 6.4): the challenge areas, causes, target group and search keywords of a problem report,
/// and up to three clarifying questions when the description is too general.
/// </summary>
public sealed class ProblemClassifier(ILlmClient llm, ILogger<ProblemClassifier> logger)
{
    public async Task<ProblemClassification> ClassifyAsync(
        string anonymizedDescription,
        IReadOnlyList<ChallengeArea> challengeAreas,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(challengeAreas);

        List<ChallengeAreaBrief> briefs = [.. challengeAreas.Select(area => new ChallengeAreaBrief(area.Code, area.Name, area.Definition))];
        var input = new ProblemClassificationInput(anonymizedDescription, briefs);
        string inputJson = LlmJson.Serialize(input);
        string instructions = PromptTemplates.Get(PromptTemplates.ClassifyProblemReport);
        var prompt = new LlmPrompt(instructions, inputJson);

        ProblemClassificationResult result = await llm.CompleteJsonAsync<ProblemClassificationResult>(prompt, cancellationToken);

        // The model chooses only from the catalogue: an unknown code is dropped, not stored (SPEC 6.2).
        IReadOnlyList<string> returnedCodes = result.ChallengeAreaCodes ?? [];
        List<ChallengeArea> knownAreas = [.. returnedCodes
            .Select(code => challengeAreas.FirstOrDefault(area => area.Code == code))
            .OfType<ChallengeArea>()
            .Distinct()];

        if (knownAreas.Count < returnedCodes.Count)
        {
            logger.LogWarning(
                "Classification returned {UnknownCount} unknown challenge area codes; they were dropped.",
                returnedCodes.Count - knownAreas.Count);
        }

        return new ProblemClassification(
            knownAreas,
            result.RootCauses ?? [],
            result.TargetGroup,
            result.Keywords ?? [],
            result.ClarifyingQuestions ?? []);
    }
}
