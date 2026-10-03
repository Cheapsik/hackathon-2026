using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Infrastructure;

/// <summary>
/// The first administrator. Roles are given by an administrator (SPEC 5), so without this nobody could become one:
/// with <c>Bootstrap:AdminEmail</c> set, that account becomes ADMIN at start-up — created with
/// <c>Bootstrap:AdminPassword</c> when it does not exist yet. Both come from secrets, never from the repository.
/// </summary>
public sealed class AdminBootstrap(
    CastorDbContext db,
    IPasswordHasher<User> passwords,
    IConfiguration configuration,
    IClock clock,
    ILogger<AdminBootstrap> logger)
{
    public async Task EnsureAsync(CancellationToken cancellationToken)
    {
        string? email = User.NormalizeEmail(configuration["Bootstrap:AdminEmail"]);
        if (email is null)
        {
            return;
        }

        DateTimeOffset now = clock.UtcNow;
        User? user = await db.Users.SingleOrDefaultAsync(candidate => candidate.Email == email, cancellationToken);
        if (user is null)
        {
            string? password = configuration["Bootstrap:AdminPassword"];
            PasswordPolicy.EnsureAcceptable(password);

            user = User.Register(email, now);
            string passwordHash = passwords.HashPassword(user, password!);
            user.AssignPasswordHash(passwordHash, now);
            db.Users.Add(user);
        }

        if (user.Role == UserRole.ADMIN)
        {
            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        user.AssignRole(UserRole.ADMIN, municipality: null, challengeAreas: [], now);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogWarning("The bootstrap account was made an administrator.");
    }
}
