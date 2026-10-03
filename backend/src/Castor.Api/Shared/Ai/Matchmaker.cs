using Microsoft.Extensions.Options;

namespace Castor.Api.Shared;

/// <summary>
/// Steps 2–4 of matching (SPEC 6.4): candidates from full-text search and challenge areas, a ranking by the language
/// model and, when the best score stays under the threshold, a hybrid of two or three innovations. Every id the model
/// returns is checked against the candidates it was given; anything else is dropped.
/// </summary>
public sealed class Matchmaker(
    ILlmClient llm,
    InnovationCandidatesQuery candidatesQuery,
    IOptions<MatchingOptions> options,
    ILogger<Matchmaker> logger)
{
    /// <summary>The hybrid prompt gets the best few candidates, not the whole list.</summary>
    private const int HybridCandidateCount = 8;

    /// <returns>The match results to store, positions from 1; empty when no innovation has a genome yet.</returns>
    public async Task<IReadOnlyList<MatchResult>> MatchAsync(
        ProblemReport report,
        DateTimeOffset matchedAt,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(report);

        MatchingOptions settings = options.Value;
        List<Innovation> candidates = await candidatesQuery.FindAsync(
            report.Keywords,
            report.ChallengeAreaCodes,
            settings.CandidateLimit,
            cancellationToken);

        if (candidates.Count == 0)
        {
            logger.LogWarning("No innovation has a genome yet, so problem report {ReportId} got no matches.", report.Id);
            return [];
        }

        string problem = report.DescribeForMatching();
        List<CandidateInnovation> described = [.. candidates.Select(Describe)];
        List<MatchResult> results = await RankAsync(report, problem, candidates, described, settings, matchedAt, cancellationToken);

        int? bestScore = results.Count > 0 ? results[0].Score : null;
        if (bestScore is null || bestScore < settings.HybridThreshold)
        {
            // The ranked innovations first: a hybrid is built from the closest ones, not from the search order.
            List<Guid> rankedIds = [.. results.Select(result => result.InnovationId).OfType<Guid>()];
            List<CandidateInnovation> hybridCandidates = [.. described
                .OrderBy(candidate => rankedIds.Contains(candidate.InnovationId) ? rankedIds.IndexOf(candidate.InnovationId) : int.MaxValue)];
            MatchResult? hybrid = await ProposeHybridAsync(report, problem, candidates, hybridCandidates, results.Count + 1, matchedAt, cancellationToken);
            if (hybrid is not null)
            {
                results.Add(hybrid);
            }
        }

        return results;
    }

    private static CandidateInnovation Describe(Innovation innovation)
    {
        InnovationGenome genome = innovation.Genome
            ?? throw new InvalidOperationException($"Candidate {innovation.Id} has no genome.");

        return new CandidateInnovation(
            innovation.Id,
            innovation.Title,
            genome.Summary,
            genome.RootCauses,
            genome.Mechanisms,
            genome.TargetGroups,
            genome.ChallengeAreaCodes);
    }

    private async Task<List<MatchResult>> RankAsync(
        ProblemReport report,
        string problem,
        List<Innovation> candidates,
        List<CandidateInnovation> described,
        MatchingOptions settings,
        DateTimeOffset matchedAt,
        CancellationToken cancellationToken)
    {
        var input = new InnovationRankingInput(problem, report.ChallengeAreaCodes, described);
        string inputJson = LlmJson.Serialize(input);
        string instructions = PromptTemplates.Get(PromptTemplates.RankInnovations);
        var prompt = new LlmPrompt(instructions, inputJson);

        InnovationRankingResult ranking = await llm.CompleteJsonAsync<InnovationRankingResult>(prompt, cancellationToken);

        IReadOnlyList<RankedInnovation> returned = ranking.Matches ?? [];
        List<RankedInnovation> accepted = [.. returned
            .Where(ranked => candidates.Any(candidate => candidate.Id == ranked.InnovationId))
            .Where(ranked => !string.IsNullOrWhiteSpace(ranked.Justification))
            .DistinctBy(ranked => ranked.InnovationId)
            .OrderByDescending(ranked => ranked.Score)
            .Take(settings.MaxMatches)];

        if (accepted.Count < returned.Count)
        {
            logger.LogWarning(
                "Ranking for problem report {ReportId} returned {DroppedCount} matches outside the candidates or without a justification; they were dropped.",
                report.Id,
                returned.Count - accepted.Count);
        }

        var results = new List<MatchResult>(accepted.Count);
        foreach (RankedInnovation ranked in accepted)
        {
            Innovation innovation = candidates.First(candidate => candidate.Id == ranked.InnovationId);
            int score = Math.Clamp(ranked.Score, MatchResult.MinScore, MatchResult.MaxScore);
            var match = MatchResult.ForProblemReport(
                report,
                innovation,
                results.Count + 1,
                score,
                ranked.Justification!,
                ranked.CitedFields ?? [],
                ranked.Adaptation,
                matchedAt);
            results.Add(match);
        }

        return results;
    }

    private async Task<MatchResult?> ProposeHybridAsync(
        ProblemReport report,
        string problem,
        List<Innovation> candidates,
        List<CandidateInnovation> described,
        int position,
        DateTimeOffset matchedAt,
        CancellationToken cancellationToken)
    {
        if (candidates.Count < MatchResult.MinHybridSources)
        {
            return null;
        }

        var input = new HybridProposalInput(problem, [.. described.Take(HybridCandidateCount)]);
        string inputJson = LlmJson.Serialize(input);
        string instructions = PromptTemplates.Get(PromptTemplates.ProposeHybrid);
        var prompt = new LlmPrompt(instructions, inputJson);

        HybridProposalResult proposal = await llm.CompleteJsonAsync<HybridProposalResult>(prompt, cancellationToken);

        List<Innovation> sources = [.. (proposal.SourceInnovationIds ?? [])
            .Distinct()
            .Select(id => candidates.FirstOrDefault(candidate => candidate.Id == id))
            .OfType<Innovation>()];

        bool usable = sources.Count is >= MatchResult.MinHybridSources and <= MatchResult.MaxHybridSources
            && !string.IsNullOrWhiteSpace(proposal.Name)
            && !string.IsNullOrWhiteSpace(proposal.Description)
            && !string.IsNullOrWhiteSpace(proposal.WhyTogether);

        if (!usable)
        {
            logger.LogWarning("The hybrid proposed for problem report {ReportId} was incomplete and was dropped.", report.Id);
            return null;
        }

        return MatchResult.HybridForProblemReport(
            report,
            proposal.Name!,
            proposal.Description!,
            sources,
            proposal.WhyTogether!,
            position,
            matchedAt);
    }
}
