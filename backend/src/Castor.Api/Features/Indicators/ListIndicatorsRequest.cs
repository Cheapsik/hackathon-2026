namespace Castor.Api.Features.Indicators;

/// <param name="ChallengeArea">When set, the general indicators and the indicators of that area.</param>
public sealed record ListIndicatorsRequest(string? ChallengeArea);
