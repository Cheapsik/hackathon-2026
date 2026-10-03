namespace Castor.Api.Features.Innovations;

/// <param name="Search">A part of the title.</param>
public sealed record ListInnovationsRequest(
    string? Search);
