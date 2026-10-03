namespace Castor.Api.Features.Ideas;

public sealed record IdeaGrantApplicationResponse(
    Guid Id,
    Guid GrantCallId,
    string GrantCallTitle);
