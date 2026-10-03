namespace Castor.Api.Features.ProblemReports;

internal static class ProblemReportConverter
{
    /// <param name="showOriginal">Whether the viewer may see the description as written (author, administrator).</param>
    public static ProblemReportResponse ToResponse(this ProblemReport report, ProblemReportView view, bool showOriginal)
    {
        ArgumentNullException.ThrowIfNull(view);

        string trackingCode = TrackingCode.Format(report.TrackingCode);
        string status = report.Status.ToString();
        string channel = report.Channel.ToString();
        ProblemReportMunicipalityResponse? municipality = report.Municipality is null
            ? null
            : new ProblemReportMunicipalityResponse(report.Municipality.Teryt, report.Municipality.QualifiedName);
        List<ProblemReportChallengeAreaResponse> areas = [.. view.ChallengeAreas.Select(area => new ProblemReportChallengeAreaResponse(area.Code, area.Name))];
        List<ClarifyingQuestionResponse> questions = [.. report.ClarifyingQuestions.Select(question => new ClarifyingQuestionResponse(question.Question, question.Answer))];
        List<MatchResponse> matches = [.. view.Matches.Where(match => match.Kind == MatchKind.MATCH).Select(ToMatchResponse)];
        MatchResult? hybrid = view.Matches.FirstOrDefault(match => match.Kind == MatchKind.HYBRID);
        HybridResponse? hybridResponse = hybrid is null ? null : ToHybridResponse(hybrid, view.HybridSources);
        var similar = new SimilarProblemReportsResponse(view.Similar.Reports, view.Similar.Municipalities);

        return new ProblemReportResponse(
            report.Id,
            trackingCode,
            status,
            channel,
            report.SubmittedOnBehalf,
            report.Description,
            showOriginal ? report.OriginalDescription : null,
            municipality,
            areas,
            questions,
            report.AwaitsAnswers,
            report.MatchedAt is not null,
            report.AuthorId is not null,
            matches,
            hybridResponse,
            similar,
            report.CreatedAt);
    }

    public static ProblemReportSummaryResponse ToSummaryResponse(this ProblemReport report)
    {
        string trackingCode = TrackingCode.Format(report.TrackingCode);
        string status = report.Status.ToString();

        return new ProblemReportSummaryResponse(
            report.Id,
            trackingCode,
            status,
            report.Description,
            report.MatchedAt is not null,
            report.CreatedAt);
    }

    public static ProblemReportCreatedEvent ToCreatedEvent(this ProblemReport report)
    {
        string channel = report.Channel.ToString();

        return new ProblemReportCreatedEvent(report.Id, channel, report.Municipality?.QualifiedName, report.CreatedAt);
    }

    private static MatchResponse ToMatchResponse(MatchResult match)
    {
        Innovation innovation = match.Innovation
            ?? throw new InvalidOperationException($"Match {match.Id} was loaded without its innovation.");
        int score = match.Score
            ?? throw new InvalidOperationException($"Match {match.Id} has no score.");

        return new MatchResponse(
            match.Position,
            score,
            innovation.Id,
            innovation.Title,
            innovation.ShortDescription,
            match.Justification,
            match.CitedFields,
            match.Adaptation,
            innovation.VideoUrl,
            innovation.CardUrl);
    }

    private static HybridResponse ToHybridResponse(MatchResult hybrid, IReadOnlyDictionary<Guid, Innovation> sources)
    {
        List<HybridSourceResponse> sourceResponses = [.. hybrid.SourceInnovationIds
            .Where(sources.ContainsKey)
            .Select(id => new HybridSourceResponse(id, sources[id].Title, sources[id].CardUrl))];

        return new HybridResponse(hybrid.HybridName!, hybrid.HybridDescription!, hybrid.Justification, sourceResponses);
    }
}
