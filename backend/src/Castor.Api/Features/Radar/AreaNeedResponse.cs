namespace Castor.Api.Features.Radar;

/// <param name="Unmatched">Reports without a match at or above the hybrid threshold.</param>
/// <param name="Innovations">Innovations whose genome covers the area.</param>
public sealed record AreaNeedResponse(
    string Code,
    string Name,
    int Reports,
    int Unmatched,
    int Innovations);
