namespace Castor.Api.Domain;

/// <summary>
/// A fictional person from the Social Challenges Map, used as a demo user and as a case for checking match quality.
/// </summary>
public sealed class Persona
{
    public const int NameMaxLength = 100;

    private Persona()
    {
    }

    public Guid Id { get; private set; }

    /// <summary>Unique: the seed import finds a persona again by it.</summary>
    public string Name { get; private set; } = null!;

    public int? Age { get; private set; }

    public List<string> Description { get; private set; } = [];

    public List<string> Goals { get; private set; } = [];

    public List<string> Challenges { get; private set; } = [];

    public List<string> Motivations { get; private set; } = [];

    public string ChallengeAreaCode { get; private set; } = null!;

    public DateTimeOffset CreatedAt { get; private set; }

    public static Persona Import(
        string name,
        int? age,
        IReadOnlyList<string> description,
        IReadOnlyList<string> goals,
        IReadOnlyList<string> challenges,
        IReadOnlyList<string> motivations,
        ChallengeArea challengeArea,
        DateTimeOffset importedAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentNullException.ThrowIfNull(description);
        ArgumentNullException.ThrowIfNull(goals);
        ArgumentNullException.ThrowIfNull(challenges);
        ArgumentNullException.ThrowIfNull(motivations);
        ArgumentNullException.ThrowIfNull(challengeArea);

        return new Persona
        {
            Id = Guid.CreateVersion7(),
            Name = name,
            Age = age,
            Description = [.. description],
            Goals = [.. goals],
            Challenges = [.. challenges],
            Motivations = [.. motivations],
            ChallengeAreaCode = challengeArea.Code,
            CreatedAt = importedAt,
        };
    }
}
