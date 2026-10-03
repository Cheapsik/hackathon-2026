namespace Castor.Api.Domain;

public static class PasswordPolicy
{
    public const int MinLength = 8;

    public static void EnsureAcceptable(string? password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < MinLength)
        {
            throw new DomainException($"A password has at least {MinLength} characters.");
        }
    }
}
