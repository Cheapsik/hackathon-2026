namespace Castor.Api.Features.Tests;

public sealed record TestSignupResponse(Guid Id, Guid TargetId, string Kind, DateTimeOffset JoinedAt);
