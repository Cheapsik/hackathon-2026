namespace Castor.Api.Features.Indicators;

public sealed record IndicatorSummaryResponse(
    Guid Id,
    string Name,
    string Group,
    string? Unit,
    bool General,
    IReadOnlyList<string> ChallengeAreaCodes);
