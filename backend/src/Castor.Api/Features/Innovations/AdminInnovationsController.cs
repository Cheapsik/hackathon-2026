using Castor.Api.Features.PlainText;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Castor.Api.Features.Innovations;

/// <summary>Entering and editing innovation cards (module VI, "Wiedza") and their plain-language rewrites (module II).</summary>
[ApiController]
[Authorize(Roles = nameof(UserRole.ADMIN))]
[Route("admin/innovations")]
public sealed class AdminInnovationsController(
    CreateInnovationHandler create,
    ReviseInnovationHandler revise,
    GetInnovationPlainTextHandler getPlainText,
    GenerateInnovationPlainTextHandler generatePlainText,
    ReviseInnovationPlainTextHandler revisePlainText,
    ApproveInnovationPlainTextHandler approvePlainText) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<InnovationResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<InnovationResponse>> Post([FromBody] CreateInnovationRequest request, CancellationToken cancellationToken)
    {
        InnovationResponse innovation = await create.HandleAsync(request, cancellationToken);

        return Created($"/api/innovations/{innovation.Id}", innovation);
    }

    [HttpPut("{innovationId:guid}")]
    public Task<InnovationResponse> Put(Guid innovationId, [FromBody] ReviseInnovationRequest request, CancellationToken cancellationToken)
    {
        return revise.HandleAsync(innovationId, request, cancellationToken);
    }

    [HttpGet("{innovationId:guid}/plain-text")]
    public Task<PlainTextResponse> GetPlainText(Guid innovationId, CancellationToken cancellationToken)
    {
        return getPlainText.HandleAsync(innovationId, cancellationToken);
    }

    [HttpPost("{innovationId:guid}/plain-text")]
    [EnableRateLimiting(RateLimitPolicies.PublicAi)]
    public Task<PlainTextResponse> GeneratePlainText(Guid innovationId, CancellationToken cancellationToken)
    {
        return generatePlainText.HandleAsync(innovationId, cancellationToken);
    }

    [HttpPut("{innovationId:guid}/plain-text")]
    public Task<PlainTextResponse> PutPlainText(Guid innovationId, [FromBody] RevisePlainTextRequest request, CancellationToken cancellationToken)
    {
        return revisePlainText.HandleAsync(innovationId, request, cancellationToken);
    }

    [HttpPost("{innovationId:guid}/plain-text/approve")]
    public Task<PlainTextResponse> ApprovePlainText(Guid innovationId, CancellationToken cancellationToken)
    {
        return approvePlainText.HandleAsync(innovationId, cancellationToken);
    }
}
