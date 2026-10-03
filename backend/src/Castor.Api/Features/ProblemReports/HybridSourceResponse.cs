namespace Castor.Api.Features.ProblemReports;

public sealed record HybridSourceResponse(
    Guid InnovationId,
    string Title,
    string? CardUrl);
