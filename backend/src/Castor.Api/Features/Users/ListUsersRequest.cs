namespace Castor.Api.Features.Users;

/// <param name="Search">A part of the e-mail address.</param>
/// <param name="Role">RESIDENT, MUNICIPAL_OFFICER, EXPERT or ADMIN; all roles when left out.</param>
public sealed record ListUsersRequest(
    string? Search,
    string? Role);
