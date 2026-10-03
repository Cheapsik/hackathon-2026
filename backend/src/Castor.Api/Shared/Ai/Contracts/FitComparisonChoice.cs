namespace Castor.Api.Shared;

/// <summary>A requirement of the innovation and the indicator of the portrait that shows the gmina's state for it.</summary>
public sealed record FitComparisonChoice(
    string? Requirement,
    Guid IndicatorId);
