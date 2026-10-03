namespace Castor.Api.Shared;

/// <summary>The grant call with its criteria and the idea card, anonymized, that applies for it.</summary>
public sealed record GrantApplicationDraftInput(
    string GrantCallTitle,
    string? GrantCallDescription,
    IReadOnlyList<string> Criteria,
    string Idea);
