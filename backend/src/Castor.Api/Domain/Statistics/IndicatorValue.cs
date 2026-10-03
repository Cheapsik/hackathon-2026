namespace Castor.Api.Domain;

/// <summary>The value of one indicator for one gmina or powiat in one year.</summary>
public sealed class IndicatorValue
{
    public const int TerritoryCodeMaxLength = 7;

    private IndicatorValue()
    {
    }

    public Guid Id { get; private set; }

    public Guid IndicatorId { get; private set; }

    public StatisticsLevel Level { get; private set; }

    /// <summary>Seven-digit TERYT of a gmina, or the four-digit code of a powiat.</summary>
    public string TerritoryCode { get; private set; } = null!;

    public int Year { get; private set; }

    public Measure Value { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public static IndicatorValue Record(
        Indicator indicator,
        StatisticsLevel level,
        string territoryCode,
        int year,
        Measure value,
        DateTimeOffset recordedAt)
    {
        ArgumentNullException.ThrowIfNull(indicator);

        int expectedLength = level == StatisticsLevel.GMINA ? Municipality.TerytLength : 4;
        if (string.IsNullOrWhiteSpace(territoryCode) || territoryCode.Length != expectedLength || !territoryCode.All(char.IsAsciiDigit))
        {
            throw new InvalidOperationException($"'{territoryCode}' is not a {level} code.");
        }

        return new IndicatorValue
        {
            Id = Guid.CreateVersion7(),
            IndicatorId = indicator.Id,
            Level = level,
            TerritoryCode = territoryCode,
            Year = year,
            Value = value,
            UpdatedAt = recordedAt,
        };
    }

    /// <summary>The register corrected a published value.</summary>
    public void Correct(Measure value, DateTimeOffset changedAt)
    {
        Value = value;
        UpdatedAt = changedAt;
    }
}
