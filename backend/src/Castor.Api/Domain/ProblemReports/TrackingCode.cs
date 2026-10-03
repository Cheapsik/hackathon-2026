using System.Security.Cryptography;

namespace Castor.Api.Domain;

/// <summary>
/// The code that gives its holder access to one problem report without an account, so it works like a password:
/// eight characters from a cryptographic random source, out of the 32 of Crockford's base32 (no I, L, O, U, which
/// read like 1, 1, 0 and V). Stored without the dash, shown as <c>K7QM-2XDF</c>.
/// </summary>
public static class TrackingCode
{
    public const int Length = 8;

    private const string Alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

    public static string Generate()
    {
        return RandomNumberGenerator.GetString(Alphabet, Length);
    }

    /// <summary>
    /// The stored form of a code a person typed: without dashes and spaces, upper case, with O read as 0 and I or L
    /// as 1. Null when the text cannot be a code.
    /// </summary>
    public static string? Normalize(string? typed)
    {
        if (string.IsNullOrWhiteSpace(typed))
        {
            return null;
        }

        var normalized = new System.Text.StringBuilder(Length);
        foreach (char character in typed.Trim().ToUpperInvariant())
        {
            if (character is '-' or ' ')
            {
                continue;
            }

            char read = character switch
            {
                'O' => '0',
                'I' or 'L' => '1',
                _ => character,
            };

            if (!Alphabet.Contains(read, StringComparison.Ordinal))
            {
                return null;
            }

            normalized.Append(read);
        }

        return normalized.Length == Length ? normalized.ToString() : null;
    }

    public static string Format(string code)
    {
        ArgumentNullException.ThrowIfNull(code);

        return $"{code[..4]}-{code[4..]}";
    }
}
