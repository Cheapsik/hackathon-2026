namespace Castor.Api.Domain;

/// <summary>
/// A measure from the Obserwator Statystyk Społecznych, e.g. the double ageing ratio. Register data: the seed import
/// updates it.
/// </summary>
public sealed class Indicator
{
    public const int NameMaxLength = 300;

    private Indicator()
    {
    }

    public Guid Id { get; private set; }

    /// <summary>The id of the indicator in the Obserwator; the seed import finds an indicator again by it.</summary>
    public int ObserverId { get; private set; }

    public string Name { get; private set; } = null!;

    /// <summary>The section of the Obserwator, e.g. "LUDNOŚĆ".</summary>
    public string Group { get; private set; } = null!;

    public string? Description { get; private set; }

    public string? Source { get; private set; }

    /// <summary>"%" for a share; null when the Obserwator does not state the unit.</summary>
    public string? Unit { get; private set; }

    /// <summary>The challenge areas the indicator describes; empty for a general one.</summary>
    public List<string> ChallengeAreaCodes { get; private set; } = [];

    /// <summary>Context of every gmina — population, density, budget, social workers — whatever the innovation's areas.</summary>
    public bool General { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public static Indicator Register(int observerId, DateTimeOffset createdAt)
    {
        if (observerId <= 0)
        {
            throw new InvalidOperationException($"'{observerId}' is not an Obserwator indicator id.");
        }

        return new Indicator
        {
            Id = Guid.CreateVersion7(),
            ObserverId = observerId,
            CreatedAt = createdAt,
        };
    }

    public void UpdateFromRegister(
        string name,
        string group,
        string? description,
        string? source,
        string? unit,
        IReadOnlyList<string> challengeAreaCodes,
        bool general,
        DateTimeOffset changedAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(group);
        ArgumentNullException.ThrowIfNull(challengeAreaCodes);

        Name = name.Trim();
        Group = group.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        Source = string.IsNullOrWhiteSpace(source) ? null : source.Trim();
        Unit = string.IsNullOrWhiteSpace(unit) ? null : unit.Trim();
        ChallengeAreaCodes = [.. challengeAreaCodes];
        General = general;
        UpdatedAt = changedAt;
    }
}
