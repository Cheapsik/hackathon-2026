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
        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, userIdText),
                new Claim(ClaimTypes.Email, user.Email),
            ],
            CookieAuthenticationDefaults.AuthenticationScheme);

        await http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));
    }
}
