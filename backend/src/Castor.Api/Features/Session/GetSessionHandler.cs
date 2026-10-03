using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Session;

/// <summary>Who is signed in, so the frontend knows after a reload without guessing from a failed request.</summary>
public sealed class GetSessionHandler(CastorDbContext db, CurrentUser currentUser)
{
    public async Task<SessionResponse> HandleAsync(CancellationToken cancellationToken)
    {
        Guid? userId = currentUser.UserIdOrNull;
        if (userId is null)
        {
            return new SessionResponse(false, null, null, null, null);
        }

        // The cookie outlives an account only in theory, but then the visitor is simply signed out.
        User? user = await db.Users.AsNoTracking().SingleOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);
        if (user is null)
        {
            return new SessionResponse(false, null, null, null, null);
        }

        string? teryt = await db.Municipalities
            .Where(municipality => municipality.Id == user.MunicipalityId)
            .Select(municipality => municipality.Teryt)
            .SingleOrDefaultAsync(cancellationToken);
        string role = user.Role.ToString();

        return new SessionResponse(true, user.Id, user.Email, role, teryt);
    }
}
