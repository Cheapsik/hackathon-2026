namespace Castor.Api.Shared;

/// <summary>Configuration section <c>Matching</c>.</summary>
public sealed class MatchingOptions
{
    public const string Section = "Matching";

    /// <summary>Below this best score the platform proposes a hybrid of innovations.</summary>
    public int HybridThreshold { get; set; } = 50;

    /// <summary>How many innovations the ranking gets to choose from.</summary>
    public int CandidateLimit { get; set; } = 30;

    public int MaxMatches { get; set; } = 5;
}
