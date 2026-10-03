namespace Castor.Api.Features.Conversations;

/// <param name="Text">The proposal itself — the first message.</param>
public sealed record CreatePartnershipRequest(Guid? InnovationId, string? Subject, string? Text);
