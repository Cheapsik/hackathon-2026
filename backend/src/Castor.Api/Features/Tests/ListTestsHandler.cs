using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Tests;

/// <summary>Innovations and ideas that seek testers (Poletko).</summary>
public sealed class ListTestsHandler(CastorDbContext db, CurrentUser currentUser)
{
    private const int Limit = 200;

    public async Task<IReadOnlyList<TestOpportunityResponse>> HandleAsync(CancellationToken cancellationToken)
    {
        Guid? userId = currentUser.UserIdOrNull;
        HashSet<Guid> signedInnovations = [];
        HashSet<Guid> signedIdeas = [];
        if (userId is Guid id)
        {
            List<TestSignup> mine = await db.TestSignups.AsNoTracking().Where(signup => signup.UserId == id).ToListAsync(cancellationToken);
            signedInnovations = [.. mine.Where(signup => signup.InnovationId is not null).Select(signup => signup.InnovationId!.Value)];
            signedIdeas = [.. mine.Where(signup => signup.IdeaId is not null).Select(signup => signup.IdeaId!.Value)];
        }

        List<Innovation> innovations = await db.Innovations.AsNoTracking()
            .Where(innovation => innovation.SeeksTesters)
            .OrderBy(innovation => innovation.Title)
            .Take(Limit)
            .ToListAsync(cancellationToken);

        List<Idea> ideas = await db.Ideas.AsNoTracking()
            .Where(idea => idea.SeeksTesters && idea.Status != IdeaStatus.DRAFT && idea.Status != IdeaStatus.REJECTED)
            .OrderBy(idea => idea.Title)
            .Take(Limit)
            .ToListAsync(cancellationToken);

        List<TestOpportunityResponse> rows =
        [
            .. innovations.Select(innovation => new TestOpportunityResponse(
                innovation.Id,
                TestTargetKind.INNOVATION.ToString(),
                innovation.Title,
                innovation.ShortDescription,
                innovation.Stage.ToString(),
                signedInnovations.Contains(innovation.Id))),
            .. ideas.Select(idea => new TestOpportunityResponse(
                idea.Id,
                TestTargetKind.IDEA.ToString(),
                idea.Title,
                idea.Solution is null ? null : idea.Solution.Length > 280 ? idea.Solution[..280] : idea.Solution,
                idea.Stage.ToString(),
                signedIdeas.Contains(idea.Id))),
        ];

        return [.. rows.OrderBy(row => row.Title, StringComparer.Create(new System.Globalization.CultureInfo("pl-PL"), ignoreCase: true))];
    }
}
