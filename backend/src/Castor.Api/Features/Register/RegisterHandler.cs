using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Register;

public sealed class RegisterHandler(CastorDbContext db, IPasswordHasher<User> passwords, IClock clock)
{
    public async Task<RegisterResult> HandleAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        PasswordPolicy.EnsureAcceptable(request.Password);

        DateTimeOffset now = clock.UtcNow;
        var user = User.Register(request.Email, now);
        string passwordHash = passwords.HashPassword(user, request.Password!);
        user.AssignPasswordHash(passwordHash, now);

        db.Users.Add(user);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (PostgresErrors.IsUniqueViolation(exception))
        {
            throw new DomainException("An account with this e-mail already exists.", StatusCodes.Status409Conflict);
        }

        return new RegisterResult(new RegisterResponse(user.Id), user);
    }
}
