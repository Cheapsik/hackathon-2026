namespace Castor.Api.Features.Ideas;

/// <summary>The signed-in reader of ideas, with their areas as an expert read from the account.</summary>
public sealed class IdeaReaderFactory(CurrentUser currentUser, ExpertChallengeAreasQuery expertAreasQuery)
{
    public async Task<IdeaReader> CurrentAsync(CancellationToken cancellationToken)
    {
        Guid userId = currentUser.UserId;
        string[] expertAreas = await expertAreasQuery.OfAsync(userId, cancellationToken);

        return new IdeaReader(userId, currentUser.IsAdmin, expertAreas);
    }
}
