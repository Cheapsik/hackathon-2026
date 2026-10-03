namespace Castor.Api.Features.ProblemReports;

/// <summary>A hybrid of innovations, proposed when no single one fits well enough.</summary>
public sealed record HybridResponse(
    string Name,
    string Description,
    string WhyTogether,
    IReadOnlyList<HybridSourceResponse> Sources);
