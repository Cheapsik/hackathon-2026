namespace Castor.Api.Features.Innovations;

/// <param name="Search">A part of the title.</param>
/// <param name="ChallengeArea">A challenge-area code; only innovations whose genome names that area.</param>
/// <param name="Category">One library category, matched exactly.</param>
/// <param name="Stage">IDEA, PROTOTYPE, TESTED or READY.</param>
/// <param name="TargetGroup">A part of the target group or of who can use the innovation.</param>
public sealed record ListInnovationsRequest(
    string? Search,
    string? ChallengeArea,
    string? Category,
    string? Stage,
    string? TargetGroup);
