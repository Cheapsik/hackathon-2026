using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Users;

/// <summary>An administrator gives a user a role, with the gmina of an officer or the areas of an expert (SPEC 5).</summary>
public sealed class AssignUserRoleHandler(CastorDbContext db, CurrentUser currentUser, IClock clock)
{
    public async Task<UserResponse> HandleAsync(Guid userId, AssignUserRoleRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!NamedEnum.TryParse(request.Role, out UserRole role))
        {
            throw new DomainException("Role is RESIDENT, MUNICIPAL_OFFICER, EXPERT or ADMIN.");
        }

        // An administrator taking their own role away could leave the platform with nobody to give it back.
        if (userId == currentUser.UserId && role != UserRole.ADMIN)
        {
            throw new DomainException("You cannot take the administrator role from yourself.", StatusCodes.Status409Conflict);
        }

        User user = await db.Users.SingleOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken)
            ?? throw new DomainException("The user does not exist.", StatusCodes.Status404NotFound);

        Municipality? municipality = await FindMunicipalityAsync(role, request.MunicipalityTeryt, cancellationToken);
        List<ChallengeArea> areas = await FindAreasAsync(role, request.ChallengeAreaCodes ?? [], cancellationToken);

        user.AssignRole(role, municipality, areas, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        return user.ToResponse(municipality);
    }

    private async Task<Municipality?> FindMunicipalityAsync(UserRole role, string? teryt, CancellationToken cancellationToken)
    {
        if (role != UserRole.MUNICIPAL_OFFICER || string.IsNullOrWhiteSpace(teryt))
        {
            return null;
        }

        string trimmed = teryt.Trim();
        return await db.Municipalities.SingleOrDefaultAsync(candidate => candidate.Teryt == trimmed, cancellationToken)
            ?? throw new DomainException("The municipality does not exist.");
    }

    private async Task<List<ChallengeArea>> FindAreasAsync(UserRole role, IReadOnlyList<string> codes, CancellationToken cancellationToken)
    {
        if (role != UserRole.EXPERT)
        {
            return [];
        }

        List<ChallengeArea> areas = await db.ChallengeAreas.Where(area => codes.Contains(area.Code)).ToListAsync(cancellationToken);
        if (areas.Count != codes.Distinct().Count())
        {
            throw new DomainException("One of the challenge areas does not exist.");
        }

        return areas;
    }
}
