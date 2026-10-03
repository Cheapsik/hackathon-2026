namespace Castor.Tests;

/// <summary>One value of an indicator: a gmina's (seven-digit TERYT) or a powiat's (four digits).</summary>
internal sealed record IndicatorFigure(StatisticsLevel Level, string TerritoryCode, int Year, decimal Value);
