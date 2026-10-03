namespace Castor.Api.Features.Radar;

/// <param name="From">The first day; twelve months back when left out.</param>
public sealed record GetRadarRequest(
    DateOnly? From,
    DateOnly? To);
