namespace Castor.Api.Queries;

/// <summary>The figures a fit assessment compares an innovation against (SPEC 6.5).</summary>
public sealed record MunicipalityPortrait(Municipality Municipality, IReadOnlyList<PortraitIndicator> Indicators)
{
    /// <summary>The newest year among the figures; null when the Obserwator has nothing for the gmina.</summary>
    public int? DataYear => Indicators.Count > 0 ? Indicators.Max(indicator => indicator.Year) : null;
}
