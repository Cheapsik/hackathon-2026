namespace Castor.Api.Features.SignIn;

/// <summary>The response, and the user the controller issues the sign-in cookie for.</summary>
public sealed record SignInOutcome(SignInResponse Response, User User);
