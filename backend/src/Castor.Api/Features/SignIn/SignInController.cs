using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.SignIn;

[ApiController]
[AllowAnonymous]
[Route("auth")]
public sealed class SignInController(SignInHandler handler) : ControllerBase
{
    [HttpPost("sign-in")]
    public async Task<ActionResult<SignInResponse>> SignIn(
        [FromBody] SignInRequest request,
        CancellationToken cancellationToken)
    {
        SignInOutcome signedIn = await handler.HandleAsync(request, cancellationToken);
        await SignInCookie.IssueAsync(HttpContext, signedIn.User);

        return Ok(signedIn.Response);
    }
}
