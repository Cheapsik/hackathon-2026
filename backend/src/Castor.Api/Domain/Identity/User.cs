using System.Net.Mail;

namespace Castor.Api.Domain;

/// <summary>An account of the platform.</summary>
public sealed class User
{
    public const int EmailMaxLength = 254;

    private User()
    {
    }

    public Guid Id { get; private set; }

    /// <summary>Trimmed and lower-cased, so one address cannot register twice in different case.</summary>
    public string Email { get; private set; } = null!;

    public string PasswordHash { get; private set; } = null!;

    public UserRole Role { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    /// <summary>The address as stored, or null when it is not an e-mail address at all.</summary>
    public static string? NormalizeEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        string normalized = email.Trim().ToLowerInvariant();
        if (normalized.Length > EmailMaxLength || !MailAddress.TryCreate(normalized, out _))
        {
            return null;
        }

        return normalized;
    }

    public static User Register(string? email, DateTimeOffset createdAt)
    {
        string normalized = NormalizeEmail(email)
            ?? throw new DomainException("A valid e-mail address is required.");

        return new User
        {
            Id = Guid.CreateVersion7(),
            Email = normalized,
            Role = UserRole.RESIDENT,
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
        };
    }

    public void AssignPasswordHash(string passwordHash, DateTimeOffset changedAt)
    {
        if (string.IsNullOrEmpty(passwordHash))
        {
            throw new InvalidOperationException("The password hash is empty.");
        }

        PasswordHash = passwordHash;
        UpdatedAt = changedAt;
    }
}
