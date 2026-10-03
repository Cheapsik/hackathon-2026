using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.GrantCalls;

[ApiController]
[AllowAnonymous]
[Route("grant-calls")]
public sealed class GrantCallsController(ListGrantCallsHandler list) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<GrantCallResponse>> Get([FromQuery] ListGrantCallsRequest request, CancellationToken cancellationToken)
    {
        return list.HandleAsync(request, cancellationToken);
    }
}
