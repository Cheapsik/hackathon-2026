namespace Castor.Api.Features.Session;

/// <summary>Who the session belongs to; a visitor without an account gets SignedIn = false.</summary>
public sealed record SessionResponse(
    bool SignedIn,
    Guid? UserId,
    string? Email,
    string? Role);
