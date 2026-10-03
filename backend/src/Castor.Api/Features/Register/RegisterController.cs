using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.Register;

[ApiController]
[AllowAnonymous]
[Route("auth")]
public sealed class RegisterController(RegisterHandler handler) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponse>> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        RegisterResult registered = await handler.HandleAsync(request, cancellationToken);
        await SignInCookie.IssueAsync(HttpContext, registered.User);

        return Created(string.Empty, registered.Response);
    }
}
