namespace Castor.Api.Shared;

/// <summary>One innovation as the model ranked it; the id is checked against the candidates.</summary>
public sealed record RankedInnovation(
    Guid InnovationId,
    int Score,
    string? Justification,
    IReadOnlyList<string>? CitedFields,
    string? Adaptation);
