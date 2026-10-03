namespace Castor.Api.Features.Ideas;

/// <param name="Recommendation">DEVELOP ("rozwijać"), REVISE ("popraw") or DECLINE ("odrzucić").</param>
public sealed record ReviewIdeaRequest(
    string? Recommendation,
    string? Comment);
