using System.Globalization;

namespace Castor.Api.Domain;

/// <summary>
/// Parses an enum from its name in the code — <c>ACTIVE</c> — never from an ordinal.
/// <see cref="Enum.TryParse{TEnum}(string, bool, out TEnum)"/> accepts <c>"1"</c> as a defined
/// member; that is not a value the API should take.
/// </summary>
public static class NamedEnum
{
    public static bool TryParse<TEnum>(string? value, out TEnum parsed)
        where TEnum : struct, Enum
    {
        parsed = default;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string trimmed = value.Trim();
        if (long.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out _))
        {
            return false;
        }

        return Enum.TryParse(trimmed, ignoreCase: true, out parsed) && Enum.IsDefined(parsed);
    }
}
