namespace Castor.Api.Features.Ideas;

/// <param name="Decision">ACCEPTED or REJECTED.</param>
public sealed record DecideIdeaRequest(
    string? Decision);
