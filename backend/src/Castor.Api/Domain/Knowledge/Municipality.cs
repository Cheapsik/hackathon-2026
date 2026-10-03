namespace Castor.Api.Domain;

/// <summary>
/// A gmina of Małopolska, identified by its TERYT code. Statistics from the register: the seed import updates them.
/// </summary>
public sealed class Municipality
{
    public const int TerytLength = 7;

    private Municipality()
    {
    }

    public Guid Id { get; private set; }

    /// <summary>Seven digits: voivodeship, powiat, gmina and its type, e.g. <c>1261011</c> for Kraków.</summary>
    public string Teryt { get; private set; } = null!;

    public string Name { get; private set; } = null!;

    public MunicipalityType Type { get; private set; }

    /// <summary>The powiat as GUS names it: <c>bocheński</c>, or <c>m. Kraków</c> for a city with powiat rights.</summary>
    public string Powiat { get; private set; } = null!;

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    /// <summary>
    /// The name with the type of the gmina. Two gminy can share a name (the town of Bochnia and the rural gmina
    /// around it), so a name alone does not say which one is meant.
    /// </summary>
    public string QualifiedName => Type switch
    {
        MunicipalityType.URBAN => $"{Name} (gmina miejska)",
        MunicipalityType.RURAL => $"{Name} (gmina wiejska)",
        MunicipalityType.URBAN_RURAL => $"{Name} (gmina miejsko-wiejska)",
        _ => Name,
    };

    public static Municipality Register(
        string teryt,
        string name,
        MunicipalityType type,
        string powiat,
        DateTimeOffset createdAt)
    {
        if (string.IsNullOrWhiteSpace(teryt) || teryt.Length != TerytLength || !teryt.All(char.IsAsciiDigit))
        {
            throw new InvalidOperationException($"'{teryt}' is not a seven-digit TERYT code.");
        }

        var municipality = new Municipality
        {
            Id = Guid.CreateVersion7(),
            Teryt = teryt,
            CreatedAt = createdAt,
        };

        municipality.UpdateFromRegister(name, type, powiat, createdAt);
        return municipality;
    }

    public void UpdateFromRegister(string name, MunicipalityType type, string powiat, DateTimeOffset changedAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(powiat);

        Name = name;
        Type = type;
        Powiat = powiat;
        UpdatedAt = changedAt;
    }
}
