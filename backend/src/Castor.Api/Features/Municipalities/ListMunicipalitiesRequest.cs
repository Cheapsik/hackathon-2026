namespace Castor.Api.Features.Municipalities;

/// <param name="Search">The beginning of the name, without diacritics if you like; all gminy when left out.</param>
public sealed record ListMunicipalitiesRequest(
    string? Search);
