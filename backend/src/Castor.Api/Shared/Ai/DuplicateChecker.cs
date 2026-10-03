namespace Castor.Api.Shared;

/// <summary>
/// The duplicate check of the Kreator (SPEC 6.6): innovations from the library and other users' submitted ideas that
/// the idea may repeat, so its author can join one, take one as the starting point or say how theirs differs. Every id
/// the model returns is checked against the candidates it was given. Users' texts go to the model anonymized.
/// </summary>
public sealed class DuplicateChecker(
    ILlmClient llm,
    InnovationCandidatesQuery innovationsQuery,
    SimilarIdeasQuery ideasQuery,
    ILogger<DuplicateChecker> logger)
{
    private const int InnovationCandidateLimit = 20;

    private const int IdeaCandidateLimit = 20;

    private const int MaxSimilar = 5;

    /// <summary>Below this the two only share a topic, which the author does not need to hear about.</summary>
    private const int MinScore = 40;

    private const int SummaryMaxLength = 800;

    public async Task<IReadOnlyList<IdeaSimilarity>> CheckAsync(Idea idea, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(idea);

        List<Innovation> innovations = await innovationsQuery.FindAsync(
            [idea.Title],
            idea.ChallengeAreaCodes,
            InnovationCandidateLimit,
            cancellationToken);
        List<Idea> ideas = await ideasQuery.FindAsync(idea, IdeaCandidateLimit, cancellationToken);

        var known = new Dictionary<Guid, KnownCandidate>();
        var candidates = new List<SimilarityCandidate>();
        foreach (Innovation innovation in innovations)
        {
            InnovationGenome genome = innovation.Genome
                ?? throw new InvalidOperationException($"Candidate {innovation.Id} has no genome.");
            string kind = nameof(IdeaSimilarityKind.INNOVATION);
            candidates.Add(new SimilarityCandidate(innovation.Id, kind, innovation.Title, genome.Summary, genome.ChallengeAreaCodes));
            known[innovation.Id] = new KnownCandidate(IdeaSimilarityKind.INNOVATION, innovation.Title);
        }

        foreach (Idea other in ideas)
        {
            string title = Anonymizer.Anonymize(other.Title);
            string described = Shorten(other.DescribeForMatching(), SummaryMaxLength);
            string summary = Anonymizer.Anonymize(described);
            string kind = nameof(IdeaSimilarityKind.IDEA);
            candidates.Add(new SimilarityCandidate(other.Id, kind, title, summary, other.ChallengeAreaCodes));
            known[other.Id] = new KnownCandidate(IdeaSimilarityKind.IDEA, other.Title);
        }

        if (candidates.Count == 0)
        {
            return [];
        }

        string card = Anonymizer.Anonymize(idea.DescribeForMatching());
        var input = new SimilarityInput(card, idea.ChallengeAreaCodes, candidates);
        string inputJson = LlmJson.Serialize(input);
        string instructions = PromptTemplates.Get(PromptTemplates.FindSimilar);
        var prompt = new LlmPrompt(instructions, inputJson);

        SimilarityResult result = await llm.CompleteJsonAsync<SimilarityResult>(prompt, cancellationToken);
        IReadOnlyList<SimilarityMatch> returned = result.Similar ?? [];

        var similar = new List<IdeaSimilarity>();
        int dropped = 0;
        foreach (SimilarityMatch match in returned.DistinctBy(match => match.Id).OrderByDescending(match => match.Score))
        {
            if (!known.TryGetValue(match.Id, out KnownCandidate? candidate) || string.IsNullOrWhiteSpace(match.Justification))
            {
                dropped++;
                continue;
            }

            int score = Math.Clamp(match.Score, MatchResult.MinScore, MatchResult.MaxScore);
            if (score >= MinScore && similar.Count < MaxSimilar)
            {
                similar.Add(IdeaSimilarity.Of(candidate.Kind, match.Id, candidate.Title, score, match.Justification));
            }
        }

        if (dropped > 0)
        {
            logger.LogWarning(
                "The duplicate check of idea {IdeaId} returned {DroppedCount} candidates outside the list or without a justification; they were dropped.",
                idea.Id,
                dropped);
        }

        return similar;
    }

    private static string Shorten(string text, int maxLength)
    {
        return text.Length <= maxLength ? text : text[..(maxLength - 1)] + "…";
    }

    /// <summary>The kind and the real title of a candidate; the model sees an idea's title anonymized.</summary>
    private sealed record KnownCandidate(IdeaSimilarityKind Kind, string Title);
}
