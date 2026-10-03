using Castor.Api.Features.Innovations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Castor.Api.Features.Feedback;

/// <summary>Ratings of an innovation and their summary for the author (SPEC 7 IV).</summary>
[ApiController]
[Route("innovations/{innovationId:guid}")]
public sealed class InnovationFeedbackController(
    WriteFeedbackHandler write,
    ListFeedbackHandler list,
    GetFeedbackSummaryHandler summary,
    SetInnovationSeeksTestersHandler seeksTesters) : ControllerBase
{
    [HttpGet("feedback")]
    public Task<IReadOnlyList<FeedbackResponse>> Get(Guid innovationId, CancellationToken cancellationToken)
    {
        return list.HandleAsync(innovationId, cancellationToken);
    }

    [HttpPost("feedback")]
    public Task<FeedbackResponse> Post(Guid innovationId, [FromBody] WriteFeedbackRequest request, CancellationToken cancellationToken)
    {
        return write.HandleAsync(innovationId, request, cancellationToken);
    }

    [HttpGet("feedback/summary")]
    [EnableRateLimiting(RateLimitPolicies.PublicAi)]
    public Task<FeedbackSummaryResponse> Summary(Guid innovationId, CancellationToken cancellationToken)
    {
        return summary.HandleAsync(innovationId, cancellationToken);
    }

    [HttpPut("seeks-testers")]
    public Task<InnovationResponse> SeeksTesters(Guid innovationId, [FromBody] SetSeeksTestersRequest request, CancellationToken cancellationToken)
    {
        return seeksTesters.HandleAsync(innovationId, request, cancellationToken);
    }
}
