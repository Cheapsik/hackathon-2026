using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Castor.Api.Features.ProblemReports;

/// <summary>
/// Problem reports, open to visitors without an account. A visitor proves access to one report with its tracking
/// code: in the route for tracking, otherwise in the <see cref="TrackingCodeHeader"/> header. Claiming a report and
/// listing one's own need a session.
/// </summary>
[ApiController]
[Route("problem-reports")]
public sealed class ProblemReportsController(
    CreateProblemReportHandler create,
    AnswerProblemReportQuestionsHandler answer,
    GetProblemReportHandler get,
    TrackProblemReportHandler track,
    ClaimProblemReportHandler claim,
    ListMyProblemReportsHandler listMine,
    MarkProblemReportAnsweredHandler markAnswered) : ControllerBase
{
    public const string TrackingCodeHeader = "X-Tracking-Code";

    [AllowAnonymous]
    [HttpPost]
    [EnableRateLimiting(RateLimitPolicies.PublicAi)]
    [ProducesResponseType<ProblemReportResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<ProblemReportResponse>> Post(
        [FromBody] CreateProblemReportRequest request,
        CancellationToken cancellationToken)
    {
        ProblemReportResponse report = await create.HandleAsync(request, cancellationToken);

        return Created($"/api/problem-reports/{report.Id}", report);
    }

    [AllowAnonymous]
    [HttpGet("{problemReportId:guid}")]
    [EnableRateLimiting(RateLimitPolicies.TrackingCode)]
    public Task<ProblemReportResponse> GetById(
        Guid problemReportId,
        [FromHeader(Name = TrackingCodeHeader)] string? trackingCode,
        CancellationToken cancellationToken)
    {
        return get.HandleAsync(problemReportId, trackingCode, cancellationToken);
    }

    [AllowAnonymous]
    [HttpPost("{problemReportId:guid}/answers")]
    [EnableRateLimiting(RateLimitPolicies.PublicAi)]
    public Task<ProblemReportResponse> Answer(
        Guid problemReportId,
        [FromHeader(Name = TrackingCodeHeader)] string? trackingCode,
        [FromBody] AnswerProblemReportQuestionsRequest request,
        CancellationToken cancellationToken)
    {
        return answer.HandleAsync(problemReportId, trackingCode, request, cancellationToken);
    }

    [AllowAnonymous]
    [HttpGet("track/{trackingCode}")]
    [EnableRateLimiting(RateLimitPolicies.TrackingCode)]
    public Task<ProblemReportResponse> Track(string trackingCode, CancellationToken cancellationToken)
    {
        return track.HandleAsync(trackingCode, cancellationToken);
    }

    [HttpPost("claim")]
    public Task<ProblemReportResponse> Claim([FromBody] ClaimProblemReportRequest request, CancellationToken cancellationToken)
    {
        return claim.HandleAsync(request, cancellationToken);
    }

    [HttpGet("mine")]
    public Task<IReadOnlyList<ProblemReportSummaryResponse>> Mine(CancellationToken cancellationToken)
    {
        return listMine.HandleAsync(cancellationToken);
    }

    /// <summary>An expert of the report's areas: "with an expert" → "answered". Administrators use the panel's move.</summary>
    [Authorize(Roles = nameof(UserRole.EXPERT))]
    [HttpPost("{problemReportId:guid}/mark-answered")]
    public Task<ProblemReportSummaryResponse> MarkAnswered(Guid problemReportId, CancellationToken cancellationToken)
    {
        return markAnswered.HandleAsync(problemReportId, cancellationToken);
    }
}
