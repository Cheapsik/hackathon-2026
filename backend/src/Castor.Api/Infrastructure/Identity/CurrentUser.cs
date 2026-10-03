using System.Security.Claims;

namespace Castor.Api.Infrastructure;

/// <summary>
/// The signed-in user of the current request. A handler takes it from here rather than as a parameter:
/// it says who asks, not what is asked.
/// </summary>
public sealed class CurrentUser(IHttpContextAccessor httpContextAccessor)
{
    /// <summary>The signed-in user; a request without a session is refused with 401.</summary>
    public Guid UserId => UserIdOrNull
        ?? throw new DomainException("The request is not signed in.", StatusCodes.Status401Unauthorized);

    /// <summary>The signed-in user, or null for a visitor without an account — for endpoints open to both.</summary>
    public Guid? UserIdOrNull
    {
        get
        {
            ClaimsPrincipal? principal = httpContextAccessor.HttpContext?.User;
            string? value = principal?.FindFirstValue(ClaimTypes.NameIdentifier);

            return Guid.TryParse(value, out Guid id) ? id : null;
        }
    }

    public bool IsAdmin => httpContextAccessor.HttpContext?.User.IsInRole(nameof(UserRole.ADMIN)) == true;
}
