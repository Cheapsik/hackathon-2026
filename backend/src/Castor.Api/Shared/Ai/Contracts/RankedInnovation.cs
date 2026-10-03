namespace Castor.Api.Shared;

/// <summary>
/// One innovation as the model ranked it; the id is checked against the candidates. A missing score stays null, so
/// the match is dropped instead of being stored with 0.
/// </summary>
public sealed record RankedInnovation(
    Guid InnovationId,
    int? Score,
    string? Justification,
    IReadOnlyList<string>? CitedFields,
    string? Adaptation);
