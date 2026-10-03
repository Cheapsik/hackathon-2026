using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.TesterProfile;

public sealed class SaveTesterProfileHandler(CastorDbContext db, CurrentUser currentUser, IClock clock)
{
    public async Task<TesterProfileResponse> HandleAsync(SaveTesterProfileRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.Age is null)
        {
            throw new DomainException("A tester's age is required.");
        }

        Municipality municipality = await db.Municipalities
                .SingleOrDefaultAsync(candidate => candidate.Teryt == request.MunicipalityTeryt, cancellationToken)
            ?? throw new DomainException("The municipality does not exist.", StatusCodes.Status404NotFound);

        User user = await db.Users.SingleAsync(candidate => candidate.Id == currentUser.UserId, cancellationToken);
        user.SaveTesterProfile(request.Age.Value, municipality, request.AccessibilityNeeds, request.Equipment, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        return new TesterProfileResponse(
            user.TesterProfile!.Age,
            municipality.Teryt,
            municipality.QualifiedName,
            user.TesterProfile.AccessibilityNeeds,
            user.TesterProfile.Equipment);
    }
}
