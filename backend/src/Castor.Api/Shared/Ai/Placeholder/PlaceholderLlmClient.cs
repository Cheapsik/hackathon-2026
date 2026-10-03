namespace Castor.Api.Shared;

/// <summary>
/// The <c>placeholder</c> provider: answers without any external service, from word overlap between the input texts,
/// so classification, matching, hybrids and genomes work end to end until a real provider is chosen (docs/TODO.md).
/// It reads the same input JSON a real model would get and returns the same result types; only the reasoning is
/// missing. Every answer is deterministic.
/// </summary>
public sealed class PlaceholderLlmClient(ILogger<PlaceholderLlmClient> logger) : ILlmClient
{
    /// <summary>A description shorter than this gets clarifying questions.</summary>
    private const int SpecificDescriptionWords = 12;

    private const int MaxKeywords = 10;

    private static readonly string[] GeneralQuestions =
    [
        "Kogo najbardziej dotyczy ten problem (np. seniorów, dzieci, osób z niepełnosprawnością)?",
        "Od jak dawna i jak często to się dzieje?",
        "Czy ktoś już próbował coś z tym zrobić w Twojej okolicy?",
    ];

    public Task<string> CompleteAsync(LlmPrompt prompt, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(prompt);

        logger.LogInformation("Placeholder language model answered a text prompt of {InputLength} characters.", prompt.Input.Length);

        string answer = prompt.Instructions == PromptTemplates.Get(PromptTemplates.FitAssistant)
            ? AdviseOnFit(LlmJson.Deserialize<FitAssistantInput>(prompt.Input))
            : "Odpowiedź przykładowa: dostawca modelu językowego nie jest jeszcze skonfigurowany.";

        return Task.FromResult(answer);
    }

    public Task<TResult> CompleteJsonAsync<TResult>(LlmPrompt prompt, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(prompt);

        object result = typeof(TResult) switch
        {
            Type type when type == typeof(ProblemClassificationResult) => Classify(LlmJson.Deserialize<ProblemClassificationInput>(prompt.Input)),
            Type type when type == typeof(InnovationRankingResult) => Rank(LlmJson.Deserialize<InnovationRankingInput>(prompt.Input)),
            Type type when type == typeof(HybridProposalResult) => ProposeHybrid(LlmJson.Deserialize<HybridProposalInput>(prompt.Input)),
            Type type when type == typeof(GenomeResult) => DescribeGenome(LlmJson.Deserialize<GenomeInput>(prompt.Input)),
            Type type when type == typeof(FitAssessmentResult) => AssessFit(LlmJson.Deserialize<FitAssessmentInput>(prompt.Input)),
            _ => throw new NotSupportedException($"The placeholder language model cannot answer with {typeof(TResult).Name}."),
        };

        logger.LogInformation(
            "Placeholder language model answered {ResultType} for {InputLength} characters of input.",
            typeof(TResult).Name,
            prompt.Input.Length);

        return Task.FromResult((TResult)result);
    }

    private static ProblemClassificationResult Classify(ProblemClassificationInput input)
    {
        HashSet<string> problemStems = PlaceholderText.Stems(input.Description);
        List<string> areaCodes = BestAreas(problemStems, input.ChallengeAreas);

        List<string> words = PlaceholderText.ContentWords(input.Description);
        List<string> keywords = [.. words
            .GroupBy(word => word)
            .OrderByDescending(group => group.Count())
            .ThenByDescending(group => group.Key.Length)
            .Select(group => group.Key)
            .Take(MaxKeywords)];

        List<string> questions = words.Count < SpecificDescriptionWords ? [.. GeneralQuestions] : [];

        return new ProblemClassificationResult(areaCodes, [], null, keywords, questions);
    }

    private static InnovationRankingResult Rank(InnovationRankingInput input)
    {
        HashSet<string> problemStems = PlaceholderText.Stems(input.Problem);

        List<RankedInnovation> ranked = [.. input.Candidates
            .Select(candidate => Score(candidate, problemStems, input.ChallengeAreaCodes))
            .Where(scored => scored.Score > 0)
            .OrderByDescending(scored => scored.Score)
            .Take(5)];

        return new InnovationRankingResult(ranked);
    }

    private static RankedInnovation Score(
        CandidateInnovation candidate,
        HashSet<string> problemStems,
        IReadOnlyList<string> problemAreaCodes)
    {
        var fields = new Dictionary<string, HashSet<string>>
        {
            ["title"] = PlaceholderText.Stems(candidate.Title),
            ["summary"] = PlaceholderText.Stems(candidate.Summary),
            ["rootCauses"] = PlaceholderText.Stems(candidate.RootCauses),
            ["mechanisms"] = PlaceholderText.Stems(candidate.Mechanisms),
            ["targetGroups"] = PlaceholderText.Stems(candidate.TargetGroups),
        };

        List<string> citedFields = [.. fields.Where(field => Overlap(problemStems, field.Value) > 0).Select(field => field.Key)];
        HashSet<string> allStems = [.. fields.Values.SelectMany(stems => stems)];
        List<string> shared = [.. problemStems.Where(allStems.Contains)];
        bool sameArea = candidate.ChallengeAreaCodes.Any(problemAreaCodes.Contains);

        // Ten points per shared word stem, twenty for a shared challenge area, capped below certainty.
        int score = Math.Min(90, (shared.Count * 10) + (sameArea ? 20 : 0));
        if (sameArea)
        {
            citedFields.Add("challengeAreaCodes");
        }

        string justification = shared.Count > 0
            ? $"Opis problemu i innowacja „{candidate.Title}” mają wspólne wątki: {string.Join(", ", shared.Take(5))}."
            : $"Innowacja „{candidate.Title}” dotyczy tego samego obszaru wyzwań co zgłoszony problem.";

        return new RankedInnovation(
            candidate.InnovationId,
            score,
            justification,
            citedFields,
            "Sprawdź, czy grupa docelowa i zasoby w Twojej gminie odpowiadają opisowi z karty innowacji.");
    }

    private static HybridProposalResult ProposeHybrid(HybridProposalInput input)
    {
        List<CandidateInnovation> sources = [.. input.Candidates.Take(2)];
        string names = string.Join(" + ", sources.Select(source => source.Title));

        return new HybridProposalResult(
            $"Krzyżówka: {names}",
            $"Połączenie innowacji {names}: każda odpowiada na część zgłoszonego problemu, razem obejmują go szerzej.",
            [.. sources.Select(source => source.InnovationId)],
            "Innowacje uzupełniają się: jedna daje narzędzie, druga dociera do osób, których problem dotyczy.");
    }

    private static GenomeResult DescribeGenome(GenomeInput input)
    {
        HashSet<string> cardStems = PlaceholderText.Stems([input.Title, input.Solution, input.Problems, input.TargetGroup, .. input.Categories]);
        List<string> areaCodes = BestAreas(cardStems, input.ChallengeAreas);

        var resources = new GenomeRequiredResourcesResult(PlaceholderText.Items(input.Beneficiaries, 5), [], null, []);
        string summary = PlaceholderText.Shorten(input.Solution ?? input.Title, 600);

        return new GenomeResult(
            PlaceholderText.Sentences(input.Problems, 3),
            PlaceholderText.Sentences(input.Solution, 3),
            PlaceholderText.Items(input.TargetGroup, 5),
            resources,
            null,
            areaCodes,
            summary);
    }

    /// <summary>
    /// A rule of thumb instead of reasoning: the share of the innovation's area indicators in which the gmina is above
    /// the region's mean decides the fit, and the rows of the table are those indicators.
    /// </summary>
    private static FitAssessmentResult AssessFit(FitAssessmentInput input)
    {
        List<FitIndicatorBrief> areaIndicators = [.. input.Indicators.Where(indicator => !indicator.General)];
        List<FitIndicatorBrief> aboveAverage = [.. areaIndicators.Where(indicator => indicator.Value > indicator.RegionAverage)];
        double share = areaIndicators.Count == 0 ? 0 : (double)aboveAverage.Count / areaIndicators.Count;
        string fit = share >= 0.6 || input.Innovation.InServiceModel ? "HIGH" : share >= 0.3 ? "MEDIUM" : "LOW";

        string summary = areaIndicators.Count == 0
            ? $"Obserwator nie ma danych gminy {input.Municipality.Name} dla obszarów tej innowacji, więc ocena opiera się tylko na danych ogólnych."
            : $"W {aboveAverage.Count} z {areaIndicators.Count} wskaźników obszarów innowacji gmina {input.Municipality.Name} jest powyżej średniej regionu, co wskazuje na potrzebę takiego rozwiązania.";
        if (input.Innovation.InServiceModel)
        {
            summary += " Innowacja jest już częścią Małopolskich Modeli Usług Społecznych.";
        }

        List<string> missing = [.. areaIndicators
            .Where(indicator => indicator.RegionAverage > 0 && indicator.Value < indicator.RegionAverage / 2)
            .Take(4)
            .Select(indicator => $"{indicator.Name}: {indicator.Value:0.##} wobec średniej regionu {indicator.RegionAverage:0.##} ({indicator.Year})")];

        FitIndicatorBrief? population = input.Indicators.FirstOrDefault(indicator => indicator.Name == "Ludność ogółem");
        string? scale = population is null
            ? null
            : $"Gmina ma ok. {population.Value:0} mieszkańców ({population.Year}); grupa docelowa to ich część.";

        List<string> requirements = [.. input.Innovation.RequiredInstitutions, .. input.Innovation.TargetGroups];
        List<FitComparisonChoice> comparison = [.. areaIndicators
            .Concat(input.Indicators.Where(indicator => indicator.General))
            .Take(8)
            .Select((indicator, index) => new FitComparisonChoice(
                indicator.General ? "Kontekst gminy" : requirements.Count > 0 ? requirements[index % requirements.Count] : "Skala potrzeby",
                indicator.IndicatorId))];

        bool urban = input.Municipality.Type == "URBAN";
        return new FitAssessmentResult(
            fit,
            summary,
            [.. input.Innovation.Mechanisms.Take(2)],
            [$"Dopasuj skalę działania do gminy {input.Municipality.Name} i jej zasobów kadrowych."],
            missing,
            urban ? "Centrum Usług Społecznych albo OPS" : "Ośrodek Pomocy Społecznej",
            "Zadanie publiczne zlecone organizacji pozarządowej albo usługa OPS",
            scale,
            comparison);
    }

    private static string AdviseOnFit(FitAssistantInput input)
    {
        string firstStep = input.ToAdapt.Count > 0 ? input.ToAdapt[0] : "Zacznij od rozmowy z ośrodkiem pomocy społecznej.";

        return $"(Asystent w trybie przykładowym, bez modelu językowego.) Dla innowacji „{input.InnovationTitle}” w gminie "
            + $"{input.MunicipalityName}: {firstStep} Realizatorem może być {input.ServiceProvider ?? "OPS"}, "
            + $"w formie: {input.ServiceForm ?? "zadanie publiczne"}. Napisałeś: „{input.Message}” — "
            + "z prawdziwym modelem dostaniesz tu plan dopasowany do Twoich zasobów.";
    }

    /// <summary>
    /// The one or two areas closest to a text. A word of the area's name counts most; words of its definition count
    /// in proportion to the definition's length, so a long definition does not win on common words alone.
    /// </summary>
    private static List<string> BestAreas(HashSet<string> textStems, IReadOnlyList<ChallengeAreaBrief> areas)
    {
        List<AreaScore> scored = [.. areas
            .Select(area =>
            {
                HashSet<string> nameStems = PlaceholderText.Stems(area.Name);
                HashSet<string> definitionStems = PlaceholderText.Stems(area.Definition);
                double nameScore = Overlap(textStems, nameStems) * 3.0;
                double definitionScore = Overlap(textStems, definitionStems) / Math.Sqrt(Math.Max(1, definitionStems.Count));
                return new AreaScore(area.Code, nameScore + definitionScore);
            })
            .Where(area => area.Score > 0)
            .OrderByDescending(area => area.Score)];

        if (scored.Count == 0)
        {
            return [];
        }

        // A second area only when it is nearly as close as the first.
        return [.. scored.Take(2).Where(area => area.Score >= scored[0].Score * 0.75).Select(area => area.Code)];
    }

    private static int Overlap(HashSet<string> left, HashSet<string> right)
    {
        return left.Count(right.Contains);
    }

    private sealed record AreaScore(string Code, double Score);
}
