namespace Castor.Api.Persistence;

/// <summary>
/// A report already classified — its areas, causes and urgency are given here, not asked from the language model — and
/// without clarifying questions. Matching runs when someone first opens it, when the genomes are ready.
/// </summary>
/// <param name="Author">An account key; null for an anonymous report.</param>
/// <param name="Status">Where an administrator moved it: RECEIVED, IN_ANALYSIS, WITH_EXPERT, ANSWERED or CLOSED.</param>
/// <param name="Messages">The report's thread, written before the status is set.</param>
public sealed record DemoProblemReportSeed(
    string? Author,
    int DaysAgo,
    string Description,
    string? MunicipalityTeryt,
    bool SubmittedOnBehalf,
    List<string> ChallengeAreas,
    List<string> RootCauses,
    string? TargetGroup,
    string Urgency,
    List<string> Keywords,
    string Status,
    List<DemoMessageSeed> Messages);
