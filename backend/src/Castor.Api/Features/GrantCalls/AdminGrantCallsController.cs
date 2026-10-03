using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Castor.Api.Features.GrantCalls;

/// <summary>"Nabory" of the administrator's panel (module VI).</summary>
[ApiController]
[Authorize(Roles = nameof(UserRole.ADMIN))]
[Route("admin/grant-calls")]
public sealed class AdminGrantCallsController(
    ListAllGrantCallsHandler list,
    CreateGrantCallHandler create,
    ReviseGrantCallHandler revise,
    OpenGrantCallHandler open,
    CloseGrantCallHandler close,
    DraftGrantCallHandler draft) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<GrantCallResponse>> Get(CancellationToken cancellationToken)
    {
        return list.HandleAsync(cancellationToken);
    }

    [HttpPost]
    [ProducesResponseType<GrantCallResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<GrantCallResponse>> Post([FromBody] CreateGrantCallRequest request, CancellationToken cancellationToken)
    {
        GrantCallResponse grantCall = await create.HandleAsync(request, cancellationToken);

        return Created($"/api/admin/grant-calls/{grantCall.Id}", grantCall);
    }

    /// <summary>"Szkic naboru" from a blank spot, written by the assistant and stored as a draft.</summary>
    [HttpPost("draft")]
    [EnableRateLimiting(RateLimitPolicies.PublicAi)]
    [ProducesResponseType<GrantCallResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<GrantCallResponse>> Draft([FromBody] DraftGrantCallRequest request, CancellationToken cancellationToken)
    {
        GrantCallResponse grantCall = await draft.HandleAsync(request, cancellationToken);

        return Created($"/api/admin/grant-calls/{grantCall.Id}", grantCall);
    }

    [HttpPut("{grantCallId:guid}")]
    public Task<GrantCallResponse> Put(Guid grantCallId, [FromBody] ReviseGrantCallRequest request, CancellationToken cancellationToken)
    {
        return revise.HandleAsync(grantCallId, request, cancellationToken);
    }

    [HttpPost("{grantCallId:guid}/open")]
    public Task<GrantCallResponse> Open(Guid grantCallId, CancellationToken cancellationToken)
    {
        return open.HandleAsync(grantCallId, cancellationToken);
    }

    [HttpPost("{grantCallId:guid}/close")]
    public Task<GrantCallResponse> Close(Guid grantCallId, CancellationToken cancellationToken)
    {
        return close.HandleAsync(grantCallId, cancellationToken);
    }
}
