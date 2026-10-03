namespace Castor.Api.Shared;

/// <summary>One candidate the model found similar to the idea.</summary>
public sealed record SimilarityMatch(
    Guid Id,
    int Score,
    string? Justification);
