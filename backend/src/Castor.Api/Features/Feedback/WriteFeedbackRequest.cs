namespace Castor.Api.Features.Feedback;

public sealed record WriteFeedbackRequest(
    int? Stars,
    string? WhatWorks,
    string? WhatToImprove,
    bool Dictated);
