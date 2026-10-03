namespace Castor.Api.Persistence;

/// <param name="Recommendation">DEVELOP, REVISE or DECLINE.</param>
public sealed record DemoIdeaReviewSeed(
    string Expert,
    string Recommendation,
    string Comment);
