namespace Castor.Api.Features.Ideas;

/// <param name="ProblemReportId">The report whose hybrid the idea develops.</param>
public sealed record CreateIdeaFromHybridRequest(
    Guid? ProblemReportId);
