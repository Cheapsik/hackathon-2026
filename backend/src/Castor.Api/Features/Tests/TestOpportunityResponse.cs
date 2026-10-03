namespace Castor.Api.Features.Tests;

public sealed record TestOpportunityResponse(
    Guid Id,
    string Kind,
    string Title,
    string? ShortDescription,
    string Stage,
    bool SignedUp);
