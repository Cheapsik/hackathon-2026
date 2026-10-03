namespace Castor.Api.Domain;

/// <summary>
/// What a user may do on the platform. Every user has exactly one; registration gives <see cref="RESIDENT"/>
/// and an administrator grants the others. A visitor without an account has no role at all.
/// </summary>
public enum UserRole
{
    RESIDENT,
    MUNICIPAL_OFFICER,
    EXPERT,
    ADMIN,
}
