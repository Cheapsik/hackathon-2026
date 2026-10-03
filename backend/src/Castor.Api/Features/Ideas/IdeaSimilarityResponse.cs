namespace Castor.Api.Features.Ideas;

/// <param name="Kind">INNOVATION or IDEA.</param>
public sealed record IdeaSimilarityResponse(
    string Kind,
    Guid TargetId,
    string Title,
    int Score,
    string Justification);
