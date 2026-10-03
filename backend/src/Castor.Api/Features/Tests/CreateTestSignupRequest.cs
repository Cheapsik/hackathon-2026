namespace Castor.Api.Features.Tests;

/// <param name="Kind">INNOVATION or IDEA — which entity <c>tests/{id}</c> points at.</param>
public sealed record CreateTestSignupRequest(string? Kind);
