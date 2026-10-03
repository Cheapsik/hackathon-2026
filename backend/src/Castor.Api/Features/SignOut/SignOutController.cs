using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.SignOut;

[ApiController]
[Route("auth")]
public sealed class SignOutController : ControllerBase
{
    [HttpPost("sign-out")]
    public async Task<IActionResult> Post()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        return NoContent();
    }
}
