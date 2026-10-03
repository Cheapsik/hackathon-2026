using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Castor.Api.Features.GrantApplications;

/// <summary>
/// Applications of ideas for open grant calls (module III): generated and edited by the idea's authors, read by ROPS.
/// </summary>
[ApiController]
public sealed class GrantApplicationsController(
    CreateGrantApplicationHandler create,
    GetGrantApplicationHandler get,
    ReviseGrantApplicationHandler revise,
    ListGrantCallApplicationsHandler listForGrantCall) : ControllerBase
{
    /// <summary>201 for a newly drafted application, 200 for the one the idea already has for this call.</summary>
    [HttpPost("ideas/{ideaId:guid}/grant-applications")]
    [EnableRateLimiting(RateLimitPolicies.PublicAi)]
    [ProducesResponseType<GrantApplicationResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<GrantApplicationResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<GrantApplicationResponse>> Post(
        Guid ideaId,
        [FromBody] CreateGrantApplicationRequest request,
        CancellationToken cancellationToken)
    {
        GrantApplicationOutcome outcome = await create.HandleAsync(ideaId, request, cancellationToken);
        if (!outcome.Created)
        {
            return Ok(outcome.Response);
        }

        return Created($"/api/grant-applications/{outcome.Response.Id}", outcome.Response);
    }

    [HttpGet("grant-applications/{grantApplicationId:guid}")]
    public Task<GrantApplicationResponse> GetById(Guid grantApplicationId, CancellationToken cancellationToken)
    {
        return get.HandleAsync(grantApplicationId, cancellationToken);
    }

    [HttpPut("grant-applications/{grantApplicationId:guid}")]
    public Task<GrantApplicationResponse> Put(
        Guid grantApplicationId,
        [FromBody] ReviseGrantApplicationRequest request,
        CancellationToken cancellationToken)
    {
        return revise.HandleAsync(grantApplicationId, request, cancellationToken);
    }

    [HttpGet("admin/grant-calls/{grantCallId:guid}/applications")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public Task<IReadOnlyList<GrantApplicationSummaryResponse>> ForGrantCall(Guid grantCallId, CancellationToken cancellationToken)
    {
        return listForGrantCall.HandleAsync(grantCallId, cancellationToken);
    }
}
