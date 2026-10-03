namespace Castor.Api.Shared;

/// <summary>What the language model returns for an application: answers in the order of the criteria.</summary>
public sealed record GrantApplicationDraftResult(
    string? Title,
    string? Summary,
    IReadOnlyList<string?>? Answers);
