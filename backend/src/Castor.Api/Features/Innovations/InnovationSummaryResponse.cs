namespace Castor.Api.Features.Innovations;

public sealed record InnovationSummaryResponse(
    Guid Id,
    string Title,
    IReadOnlyList<string> Categories,
    string Stage,
    bool HasGenome,
    string? GenomeStatus,
    string? ShortDescription,
    string? VideoUrl,
    IReadOnlyList<string> ChallengeAreaCodes);
