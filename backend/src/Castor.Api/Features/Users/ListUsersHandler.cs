using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Users;

public sealed class ListUsersHandler(CastorDbContext db)
{
    /// <summary>The panel lists accounts to give roles, not the whole register at once.</summary>
    private const int Limit = 200;

    public async Task<IReadOnlyList<UserResponse>> HandleAsync(ListUsersRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        IQueryable<User> query = db.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            string search = request.Search.Trim().ToLowerInvariant();
            query = query.Where(user => user.Email.Contains(search));
        }

        if (request.Role is not null)
        {
            if (!NamedEnum.TryParse(request.Role, out UserRole role))
            {
                throw new DomainException("Role is RESIDENT, MUNICIPAL_OFFICER, EXPERT or ADMIN.");
            }

            query = query.Where(user => user.Role == role);
        }

        List<User> users = await query.OrderBy(user => user.Email).Take(Limit).ToListAsync(cancellationToken);
        List<Guid> municipalityIds = [.. users.Select(user => user.MunicipalityId).OfType<Guid>().Distinct()];
        Dictionary<Guid, Municipality> municipalities = await db.Municipalities
            .AsNoTracking()
            .Where(municipality => municipalityIds.Contains(municipality.Id))
            .ToDictionaryAsync(municipality => municipality.Id, cancellationToken);

        return [.. users.Select(user => user.ToResponse(user.MunicipalityId is Guid id ? municipalities[id] : null))];
    }
}
