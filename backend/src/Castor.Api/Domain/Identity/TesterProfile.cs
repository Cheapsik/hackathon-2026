namespace Castor.Api.Domain;

/// <summary>
/// The tester profile kept once on the account (SPEC 7 IV): age, gmina, accessibility needs and equipment. Used when
/// the user signs up for another test.
/// </summary>
public sealed class TesterProfile
{
    public const int AgeMin = 13;

    public const int AgeMax = 120;

    public const int NeedsMaxLength = 1000;

    public const int EquipmentMaxLength = 1000;

    private TesterProfile()
    {
    }

    public int Age { get; private set; }

    public Guid MunicipalityId { get; private set; }

    public string AccessibilityNeeds { get; private set; } = null!;

    public string Equipment { get; private set; } = null!;

    public static TesterProfile Write(int age, Municipality municipality, string? accessibilityNeeds, string? equipment)
    {
        ArgumentNullException.ThrowIfNull(municipality);

        if (age is < AgeMin or > AgeMax)
        {
            throw new DomainException($"A tester's age is a number from {AgeMin} to {AgeMax}.");
        }

        return new TesterProfile
        {
            Age = age,
            MunicipalityId = municipality.Id,
            AccessibilityNeeds = Cut(accessibilityNeeds, NeedsMaxLength, "Accessibility needs"),
            Equipment = Cut(equipment, EquipmentMaxLength, "Equipment"),
        };
    }

    private static string Cut(string? text, int maxLength, string label)
    {
        string trimmed = (text ?? string.Empty).Trim();
        if (trimmed.Length > maxLength)
        {
            throw new DomainException($"{label} have at most {maxLength} characters.");
        }

        return trimmed;
    }
}
