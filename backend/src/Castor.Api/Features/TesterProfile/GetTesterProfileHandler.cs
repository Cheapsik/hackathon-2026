using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.TesterProfile;

public sealed class GetTesterProfileHandler(CastorDbContext db, CurrentUser currentUser)
{
    public async Task<TesterProfileResponse> HandleAsync(CancellationToken cancellationToken)
    {
        User user = await db.Users.AsNoTracking().SingleAsync(candidate => candidate.Id == currentUser.UserId, cancellationToken);
        if (user.TesterProfile is null)
        {
            throw new DomainException("The tester profile is empty.", StatusCodes.Status404NotFound);
        }

        Municipality municipality = await db.Municipalities.AsNoTracking()
                .SingleOrDefaultAsync(candidate => candidate.Id == user.TesterProfile.MunicipalityId, cancellationToken)
            ?? throw new InvalidOperationException($"Tester profile of {user.Id} points at a missing municipality.");

        return new TesterProfileResponse(
            user.TesterProfile.Age,
            municipality.Teryt,
            municipality.QualifiedName,
            user.TesterProfile.AccessibilityNeeds,
            user.TesterProfile.Equipment);
    }
}
