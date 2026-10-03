namespace Castor.Api.Features.FitAssessments;

public sealed record FitAssistantMessageResponse(
    Guid Id,
    string Role,
    string Text,
    DateTimeOffset CreatedAt);
