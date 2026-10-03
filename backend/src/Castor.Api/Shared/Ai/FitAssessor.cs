namespace Castor.Api.Shared;

/// <summary>
/// The content of a "karta dopasowania do gminy" (SPEC 6.5): the language model compares the innovation's required
/// resources with the gmina's portrait. The numbers of the comparison table are taken from the portrait, never from the
/// model, which only says which indicator shows which requirement.
/// </summary>
public sealed class FitAssessor(ILlmClient llm, ILogger<FitAssessor> logger)
{
    private const int MaxComparisonRows = 8;

    public async Task<FitAssessmentContent> AssessAsync(
        Innovation innovation,
        MunicipalityPortrait portrait,
        IReadOnlyList<string> serviceModelExamples,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(innovation);
        ArgumentNullException.ThrowIfNull(portrait);
        ArgumentNullException.ThrowIfNull(serviceModelExamples);

        InnovationGenome genome = innovation.Genome
            ?? throw new InvalidOperationException($"Innovation {innovation.Id} has no genome to assess.");

        FitAssessmentInput input = Describe(innovation, genome, portrait, serviceModelExamples);
        string inputJson = LlmJson.Serialize(input);
        string instructions = PromptTemplates.Get(PromptTemplates.AssessFit);
        var prompt = new LlmPrompt(instructions, inputJson);

        FitAssessmentResult result = await llm.CompleteJsonAsync<FitAssessmentResult>(prompt, cancellationToken);

        if (!NamedEnum.TryParse(result.Fit, out FitLevel fit))
        {
            throw new InvalidOperationException($"The language model returned the fit '{result.Fit}', not HIGH, MEDIUM or LOW.");
        }

        if (string.IsNullOrWhiteSpace(result.Summary))
        {
            throw new InvalidOperationException("The language model returned a fit assessment without a summary.");
        }

        List<FitComparisonRow> comparison = Comparison(result.Comparison ?? [], portrait, innovation.Id);

        return new FitAssessmentContent(
            fit,
            result.Summary,
            result.Unchanged ?? [],
            result.ToAdapt ?? [],
            result.Missing ?? [],
            result.ServiceProvider,
            result.ServiceForm,
            result.ScaleEstimate,
            comparison);
    }

    private static FitAssessmentInput Describe(
        Innovation innovation,
        InnovationGenome genome,
        MunicipalityPortrait portrait,
        IReadOnlyList<string> serviceModelExamples)
    {
        RequiredResources resources = genome.RequiredResources;
        var innovationBrief = new FitInnovationBrief(
            innovation.Title,
            genome.Summary,
            genome.Mechanisms,
            genome.TargetGroups,
            resources.Institutions,
            resources.People,
            resources.Budget,
            resources.Infrastructure,
            genome.Scale,
            genome.ChallengeAreaCodes,
            innovation.InServiceModel);

        Municipality municipality = portrait.Municipality;
        string type = municipality.Type.ToString();
        var municipalityBrief = new FitMunicipalityBrief(municipality.Name, type, municipality.Powiat);

        List<FitIndicatorBrief> indicators = [.. portrait.Indicators.Select(indicator => new FitIndicatorBrief(
            indicator.IndicatorId,
            indicator.Name,
            indicator.Unit,
            indicator.ChallengeAreaCodes,
            indicator.General,
            indicator.Level.ToString(),
            indicator.Value,
            indicator.RegionAverage,
            indicator.Year))];

        return new FitAssessmentInput(innovationBrief, municipalityBrief, indicators, serviceModelExamples);
    }

    /// <summary>Rows whose indicator is not in the portrait are dropped: the model chooses only from what it was given.</summary>
    private List<FitComparisonRow> Comparison(
        IReadOnlyList<FitComparisonChoice> choices,
        MunicipalityPortrait portrait,
        Guid innovationId)
    {
        var rows = new List<FitComparisonRow>();
        foreach (FitComparisonChoice choice in choices.Where(choice => !string.IsNullOrWhiteSpace(choice.Requirement)))
        {
            PortraitIndicator? indicator = portrait.Indicators.FirstOrDefault(candidate => candidate.IndicatorId == choice.IndicatorId);
            if (indicator is null)
            {
                logger.LogWarning("Fit assessment of innovation {InnovationId} cited an indicator outside the portrait; it was dropped.", innovationId);
                continue;
            }

            rows.Add(FitComparisonRow.Of(
                choice.Requirement!,
                indicator.Name,
                indicator.Unit,
                indicator.Level,
                indicator.Value,
                indicator.RegionAverage,
                indicator.Year));

            if (rows.Count == MaxComparisonRows)
            {
                break;
            }
        }

        return rows;
    }
}
