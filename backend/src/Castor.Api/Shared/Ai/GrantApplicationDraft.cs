namespace Castor.Api.Shared;

/// <summary>An application draft checked and cut to the limits of <see cref="GrantApplication"/>.</summary>
/// <param name="Answers">One per criterion of the call, in its order; null where the model left one open.</param>
public sealed record GrantApplicationDraft(
    string Title,
    string? Summary,
    IReadOnlyList<string?> Answers);
