using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace Castor.Api.Infrastructure;

/// <summary>
/// Live updates in the app — the platform sends no e-mail, SMS or push. A signed-in connection joins its user's
/// group and, for an administrator, the administrators' group. A visitor without an account may connect too: it
/// follows one problem report by its tracking code.
/// </summary>
public sealed class LiveHub : Hub
{
    public const string Path = "/hubs/live";

    public const string AdminsGroup = "admins";

    public static string UserGroup(Guid userId)
    {
        return $"user:{userId}";
    }

    public override async Task OnConnectedAsync()
    {
        ClaimsPrincipal? principal = Context.User;
        string? userIdText = principal?.FindFirstValue(ClaimTypes.NameIdentifier);

        if (Guid.TryParse(userIdText, out Guid userId))
        {
            string userGroup = UserGroup(userId);
            await Groups.AddToGroupAsync(Context.ConnectionId, userGroup);
        }

        if (principal?.IsInRole(nameof(UserRole.ADMIN)) == true)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, AdminsGroup);
        }

        await base.OnConnectedAsync();
    }
}
