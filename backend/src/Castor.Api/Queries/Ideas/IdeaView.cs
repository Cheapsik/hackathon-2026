namespace Castor.Api.Queries;

/// <summary>What an idea is shown with: its areas, the innovations it refers to, reviews, its innovation and applications.</summary>
/// <param name="InnovationTitles">Of the hybrid's sources and the starting innovation.</param>
/// <param name="InnovationId">The innovation the idea grew into, if any.</param>
public sealed record IdeaView(
    IReadOnlyList<ChallengeArea> ChallengeAreas,
    IReadOnlyDictionary<Guid, string> InnovationTitles,
    IReadOnlyList<IdeaReview> Reviews,
    Guid? InnovationId,
    IReadOnlyList<IdeaGrantApplicationView> GrantApplications);
