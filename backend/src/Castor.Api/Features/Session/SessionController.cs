using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.Session;

[ApiController]
[AllowAnonymous]
[Route("auth")]
public sealed class SessionController(GetSessionHandler handler) : ControllerBase
{
    [HttpGet("session")]
    public Task<SessionResponse> Get(CancellationToken cancellationToken)
    {
        return handler.HandleAsync(cancellationToken);
    }
}
