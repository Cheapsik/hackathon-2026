namespace Castor.Api.Features.Feedback;

public sealed record FeedbackResponse(
    Guid Id,
    int Stars,
    string? WhatWorks,
    string? WhatToImprove,
    bool Dictated,
    bool Mine,
    DateTimeOffset UpdatedAt);
