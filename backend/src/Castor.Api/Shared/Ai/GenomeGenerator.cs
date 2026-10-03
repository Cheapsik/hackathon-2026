namespace Castor.Api.Shared;

/// <summary>
/// A draft genome from the six sections of an innovation card (SPEC 6.3). An administrator approves or corrects it
/// later; until then matching uses the draft.
/// </summary>
public sealed class GenomeGenerator(ILlmClient llm)
{
    public async Task<InnovationGenome> GenerateAsync(
        Innovation innovation,
        IReadOnlyList<ChallengeArea> challengeAreas,
        DateTimeOffset generatedAt,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(innovation);
        ArgumentNullException.ThrowIfNull(challengeAreas);

        List<ChallengeAreaBrief> briefs = [.. challengeAreas.Select(area => new ChallengeAreaBrief(area.Code, area.Name, area.Definition))];
        var input = new GenomeInput(
            innovation.Title,
            innovation.Categories,
            innovation.Solution,
            innovation.Problems,
            innovation.TargetGroup,
            innovation.Beneficiaries,
            innovation.Evidence,
            briefs);
        string inputJson = LlmJson.Serialize(input);
        string instructions = PromptTemplates.Get(PromptTemplates.GenerateGenome);
        var prompt = new LlmPrompt(instructions, inputJson);

        GenomeResult result = await llm.CompleteJsonAsync<GenomeResult>(prompt, cancellationToken);

        GenomeRequiredResourcesResult? resources = result.RequiredResources;
        var requiredResources = RequiredResources.Describe(
            resources?.Institutions ?? [],
            resources?.People ?? [],
            resources?.Budget,
            resources?.Infrastructure ?? []);

        // Only known areas: the model chooses from the catalogue (SPEC 6.2).
        IReadOnlyList<string> returnedCodes = result.ChallengeAreaCodes ?? [];
        List<ChallengeArea> knownAreas = [.. challengeAreas.Where(area => returnedCodes.Contains(area.Code))];

        string summary = Shorten(result.Summary, InnovationGenome.SummaryMaxLength);

        return InnovationGenome.Draft(
            innovation,
            result.RootCauses ?? [],
            result.Mechanisms ?? [],
            result.TargetGroups ?? [],
            requiredResources,
            result.Scale,
            knownAreas,
            summary,
            generatedAt);
    }

    /// <summary>A summary over the limit is cut at the last whole word rather than refused: the rest of the genome is usable.</summary>
    private static string Shorten(string? text, int maxLength)
    {
        string trimmed = text?.Trim() ?? string.Empty;
        if (trimmed.Length <= maxLength)
        {
            return trimmed;
        }

        string cut = trimmed[..(maxLength - 1)];
        int lastSpace = cut.LastIndexOf(' ');
        string whole = lastSpace > 0 ? cut[..lastSpace] : cut;

        return whole + "…";
    }
}
