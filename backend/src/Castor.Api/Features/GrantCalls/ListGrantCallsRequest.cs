namespace Castor.Api.Features.GrantCalls;

/// <param name="Open">true: open calls only; otherwise open and closed ones. Drafts are never public.</param>
public sealed record ListGrantCallsRequest(
    bool? Open);
