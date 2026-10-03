using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.Innovations;

[ApiController]
[AllowAnonymous]
[Route("innovations")]
public sealed class InnovationsController(GetInnovationHandler get, ListInnovationsHandler list) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<InnovationSummaryResponse>> Get([FromQuery] ListInnovationsRequest request, CancellationToken cancellationToken)
    {
        return list.HandleAsync(request, cancellationToken);
    }

    [HttpGet("{innovationId:guid}")]
    public Task<InnovationResponse> GetById(Guid innovationId, CancellationToken cancellationToken)
    {
        return get.HandleAsync(innovationId, cancellationToken);
    }
}
