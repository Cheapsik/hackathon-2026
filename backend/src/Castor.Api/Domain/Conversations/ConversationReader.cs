namespace Castor.Api.Domain;

/// <summary>Who opens a conversation — what decides whether they see it and on which side they write.</summary>
/// <param name="UserId">The signed-in user; null for a visitor without an account.</param>
/// <param name="ExpertChallengeAreaCodes">The areas of an expert; empty for every other role.</param>
/// <param name="TrackingCode">The normalized code a visitor presents for a report's thread; null when none.</param>
public sealed record ConversationReader(
    Guid? UserId,
    bool IsAdmin,
    string[] ExpertChallengeAreaCodes,
    string? TrackingCode);
