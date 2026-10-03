namespace Castor.Api.Features.Register;

/// <summary>The response, and the user the controller issues the sign-in cookie for.</summary>
public sealed record RegisterResult(RegisterResponse Response, User User);
