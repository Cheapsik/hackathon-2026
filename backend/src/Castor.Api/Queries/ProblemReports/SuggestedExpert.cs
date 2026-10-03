namespace Castor.Api.Queries;

/// <summary>An expert whose challenge areas cover some of a report's areas.</summary>
public sealed record SuggestedExpert(Guid UserId, string Email, IReadOnlyList<string> SharedChallengeAreaCodes);
