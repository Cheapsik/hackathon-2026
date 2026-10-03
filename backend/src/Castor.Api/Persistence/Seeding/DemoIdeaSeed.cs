namespace Castor.Api.Persistence;

/// <summary>An idea card of the Kreator, taken as far as <see cref="Status"/>.</summary>
/// <param name="Status">DRAFT, SUBMITTED, ACCEPTED or REJECTED.</param>
/// <param name="Testers">Account keys of testers signed up on Poletko; needs <see cref="SeeksTesters"/>.</param>
public sealed record DemoIdeaSeed(
    string Author,
    int DaysAgo,
    string Title,
    List<string> ChallengeAreas,
    int ProblemIntensity,
    int ProblemFrequency,
    int ProblemScale,
    List<string> Recipients,
    string Solution,
    string Stage,
    string? Supporters,
    string? Opponents,
    List<string> EmotionalValues,
    List<string> FunctionalValues,
    string Status,
    bool SeeksTesters,
    List<DemoIdeaReviewSeed> Reviews,
    List<string> Testers);
