namespace Castor.Api.Features.ProblemReports;

public sealed record SuggestedExpertResponse(
    Guid UserId,
    string Email,
    IReadOnlyList<string> SharedChallengeAreaCodes);
