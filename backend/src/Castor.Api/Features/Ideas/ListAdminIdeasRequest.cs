namespace Castor.Api.Features.Ideas;

/// <param name="Status">SUBMITTED, ACCEPTED or REJECTED; every idea outside drafts when empty.</param>
public sealed record ListAdminIdeasRequest(
    string? Status);
