using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.Innovations;

[ApiController]
[AllowAnonymous]
[Route("innovations")]
public sealed class InnovationsController(GetInnovationHandler get) : ControllerBase
{
    [HttpGet("{innovationId:guid}")]
    public Task<InnovationResponse> GetById(Guid innovationId, CancellationToken cancellationToken)
    {
        return get.HandleAsync(innovationId, cancellationToken);
    }
}
