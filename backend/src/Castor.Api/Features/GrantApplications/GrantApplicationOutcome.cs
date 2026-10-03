namespace Castor.Api.Features.GrantApplications;

/// <param name="Created">False when the idea already had an application for the call and it is returned instead.</param>
public sealed record GrantApplicationOutcome(
    GrantApplicationResponse Response,
    bool Created);
