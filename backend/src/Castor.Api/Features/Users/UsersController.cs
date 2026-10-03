using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.Users;

/// <summary>Accounts and roles — administrators only (module VI).</summary>
[ApiController]
[Authorize(Roles = nameof(UserRole.ADMIN))]
[Route("admin/users")]
public sealed class UsersController(ListUsersHandler list, AssignUserRoleHandler assignRole) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<UserResponse>> Get([FromQuery] ListUsersRequest request, CancellationToken cancellationToken)
    {
        return list.HandleAsync(request, cancellationToken);
    }

    [HttpPost("{userId:guid}/role")]
    public Task<UserResponse> AssignRole(Guid userId, [FromBody] AssignUserRoleRequest request, CancellationToken cancellationToken)
    {
        return assignRole.HandleAsync(userId, request, cancellationToken);
    }
}
