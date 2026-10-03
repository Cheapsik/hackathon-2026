namespace Castor.Api.Features.Ideas;

/// <summary>The rows an idea card refers to, found by <see cref="IdeaCardResolver"/>.</summary>
public sealed record ResolvedIdeaCard(
    IReadOnlyList<ChallengeArea> ChallengeAreas,
    Innovation? StartingInnovation);
