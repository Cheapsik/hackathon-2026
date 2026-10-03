namespace Castor.Api.Domain;

/// <summary>The territory a value describes. Many Obserwator indicators exist only per powiat.</summary>
public enum StatisticsLevel
{
    /// <summary>A gmina; the code is its seven-digit TERYT.</summary>
    GMINA,

    /// <summary>A powiat; the code is the first four digits of its gminy's TERYT.</summary>
    POWIAT,
}
