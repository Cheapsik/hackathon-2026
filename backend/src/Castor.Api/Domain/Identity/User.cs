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

    /// <summary>The one gmina of a <see cref="UserRole.MUNICIPAL_OFFICER"/>; null for every other role.</summary>
    public Guid? MunicipalityId { get; private set; }

    /// <summary>The challenge areas of an <see cref="UserRole.EXPERT"/>; empty for every other role.</summary>
    public List<string> ChallengeAreaCodes { get; private set; } = [];

    /// <summary>Filled once for the Poletko; reused on every "Chcę testować".</summary>
    public TesterProfile? TesterProfile { get; private set; }

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

    /// <summary>
    /// An administrator gives the user a role (SPEC 5): a municipal officer with exactly one gmina, an expert with at
    /// least one challenge area. The role travels in the sign-in cookie, so it applies from the next sign-in.
    /// </summary>
    public void AssignRole(
        UserRole role,
        Municipality? municipality,
        IReadOnlyList<ChallengeArea> challengeAreas,
        DateTimeOffset changedAt)
    {
        ArgumentNullException.ThrowIfNull(challengeAreas);

        if (role == UserRole.MUNICIPAL_OFFICER && municipality is null)
        {
            throw new DomainException("A municipal officer needs a municipality.");
        }

        if (role == UserRole.EXPERT && challengeAreas.Count == 0)
        {
            throw new DomainException("An expert needs at least one challenge area.");
        }

        Role = role;
        MunicipalityId = role == UserRole.MUNICIPAL_OFFICER ? municipality!.Id : null;
        ChallengeAreaCodes = role == UserRole.EXPERT ? [.. challengeAreas.Select(area => area.Code).Distinct()] : [];
        UpdatedAt = changedAt;
    }

    public void SaveTesterProfile(int age, Municipality municipality, string? accessibilityNeeds, string? equipment, DateTimeOffset changedAt)
    {
        TesterProfile = TesterProfile.Write(age, municipality, accessibilityNeeds, equipment);
        UpdatedAt = changedAt;
    }
}
