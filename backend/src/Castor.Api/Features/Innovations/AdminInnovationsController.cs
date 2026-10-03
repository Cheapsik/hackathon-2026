using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.Innovations;

/// <summary>Entering and editing innovation cards (module VI, "Wiedza").</summary>
[ApiController]
[Authorize(Roles = nameof(UserRole.ADMIN))]
[Route("admin/innovations")]
public sealed class AdminInnovationsController(CreateInnovationHandler create, ReviseInnovationHandler revise) : ControllerBase
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
}
