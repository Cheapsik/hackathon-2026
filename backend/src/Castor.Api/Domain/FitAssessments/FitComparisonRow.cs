namespace Castor.Api.Domain;

/// <summary>
/// One row of "what the innovation requires vs the state of the gmina": the figures as they were when the card was
/// generated, so the card keeps showing what it was based on after the register changes.
/// </summary>
public sealed class FitComparisonRow
{
    private FitComparisonRow()
    {
    }

    public string Requirement { get; private set; } = null!;

    public string IndicatorName { get; private set; } = null!;

    public string? Unit { get; private set; }

    public StatisticsLevel Level { get; private set; }

    public decimal Value { get; private set; }

    /// <summary>The mean over the region's gminy (or powiats, for a powiat value) in the same year.</summary>
    public decimal RegionAverage { get; private set; }

    public int Year { get; private set; }

    public static FitComparisonRow Of(
        string requirement,
        string indicatorName,
        string? unit,
        StatisticsLevel level,
        decimal value,
        decimal regionAverage,
        int year)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(requirement);
        ArgumentException.ThrowIfNullOrWhiteSpace(indicatorName);

        return new FitComparisonRow
        {
            Requirement = requirement.Trim(),
            IndicatorName = indicatorName,
            Unit = unit,
            Level = level,
            Value = value,
            RegionAverage = regionAverage,
            Year = year,
        };
    }
}
