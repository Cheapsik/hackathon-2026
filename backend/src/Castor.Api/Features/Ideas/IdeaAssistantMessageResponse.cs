namespace Castor.Api.Features.Ideas;

public sealed record IdeaAssistantMessageResponse(
    Guid Id,
    string Role,
    string Text,
    DateTimeOffset CreatedAt);
