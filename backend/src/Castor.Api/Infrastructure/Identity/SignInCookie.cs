using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace Castor.Api.Infrastructure;

public static class SignInCookie
{
    public static async Task IssueAsync(HttpContext http, User user)
    {
        ArgumentNullException.ThrowIfNull(http);
        ArgumentNullException.ThrowIfNull(user);

        string userIdText = user.Id.ToString();
        string roleText = user.Role.ToString();

        // The role travels in the cookie, so a role changed by an administrator applies from the next sign-in.
        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, userIdText),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, roleText),
            ],
            CookieAuthenticationDefaults.AuthenticationScheme);

        await http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));
    }
}
