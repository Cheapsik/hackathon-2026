using System.Security.Claims;

namespace Castor.Api.Infrastructure;

/// <summary>
/// The signed-in user of the current request. A handler takes it from here rather than as a parameter:
/// it says who asks, not what is asked.
/// </summary>
public sealed class CurrentUser(IHttpContextAccessor httpContextAccessor)
{
    public Guid UserId => ClaimedId(ClaimTypes.NameIdentifier);

    private Guid ClaimedId(string claimType)
    {
        ClaimsPrincipal principal = httpContextAccessor.HttpContext?.User
            ?? throw new DomainException("The request is not signed in.", StatusCodes.Status401Unauthorized);

        string? value = principal.FindFirstValue(claimType);
        if (!Guid.TryParse(value, out Guid id))
        {
            throw new DomainException("The request is not signed in.", StatusCodes.Status401Unauthorized);
        }

        return id;
    }
}
