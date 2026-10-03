namespace Castor.Api.Features.Conversations;

/// <param name="SenderRole">INITIATOR, EXPERT or ADMIN.</param>
/// <param name="Mine">Written by the reader, on the side they write on now.</param>
public sealed record MessageResponse(
    Guid Id,
    string SenderRole,
    bool Mine,
    string Text,
    DateTimeOffset PostedAt);
