namespace Castor.Api.Shared;

/// <summary>Configuration section <c>Matching</c>.</summary>
public sealed class MatchingOptions
{
    public const string Section = "Matching";

    /// <summary>Below this best score the platform proposes a hybrid of innovations.</summary>
    public int HybridThreshold { get; set; } = 50;

    /// <summary>
    /// How many innovations the ranking gets to choose from. Without embeddings it covers the whole library (~115), as
    /// SPEC 6.4 says; with vector search it goes down to about 30.
    /// </summary>
    public int CandidateLimit { get; set; } = 150;

    public int MaxMatches { get; set; } = 5;
}
