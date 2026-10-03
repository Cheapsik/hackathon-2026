using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.SignIn;

public sealed class SignInHandler(CastorDbContext db, IPasswordHasher<User> passwords)
{
    public async Task<SignInOutcome> HandleAsync(SignInRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        // One answer for every failure, so the response does not tell which addresses have an account.
        string? email = User.NormalizeEmail(request.Email);
        if (email is null || string.IsNullOrEmpty(request.Password))
        {
            throw new DomainException("Invalid e-mail or password.", StatusCodes.Status401Unauthorized);
        }

        User? user = await db.Users.SingleOrDefaultAsync(candidate => candidate.Email == email, cancellationToken);
        if (user is null)
        {
            throw new DomainException("Invalid e-mail or password.", StatusCodes.Status401Unauthorized);
        }

        PasswordVerificationResult verification = passwords.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verification == PasswordVerificationResult.Failed)
        {
            throw new DomainException("Invalid e-mail or password.", StatusCodes.Status401Unauthorized);
        }

        return new SignInOutcome(new SignInResponse(user.Id), user);
    }
}
