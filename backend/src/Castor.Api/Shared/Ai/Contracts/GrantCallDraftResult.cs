namespace Castor.Api.Shared;

/// <summary>What the language model returns for a grant call draft; checked by <see cref="GrantCallDrafter"/>.</summary>
public sealed record GrantCallDraftResult(
    string? Title,
    string? Description,
    IReadOnlyList<string>? Criteria);
