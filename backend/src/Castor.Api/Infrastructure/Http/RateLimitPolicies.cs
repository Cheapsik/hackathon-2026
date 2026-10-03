namespace Castor.Api.Infrastructure;

public static class RateLimitPolicies
{
    /// <summary>
    /// Public endpoints that call the language model: a limit per client IP, so an anonymous visitor cannot run up the
    /// bill (SPEC 9). Window and limit come from <c>RateLimiting:PublicAi</c>.
    /// </summary>
    public const string PublicAi = "public-ai";
}
