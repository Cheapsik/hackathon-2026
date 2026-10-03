namespace Castor.Api.Features.ProblemReports;

public sealed record ClarifyingQuestionResponse(
    string Question,
    string? Answer);
