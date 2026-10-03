namespace Castor.Api.Features.Indicators;

/// <param name="Teryt">The seven-digit code of the gmina, also when the figure is the powiat's.</param>
public sealed record IndicatorTerritoryValueResponse(string Teryt, string Name, decimal Value);
