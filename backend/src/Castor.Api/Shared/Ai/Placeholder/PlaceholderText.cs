using System.Globalization;
using System.Text;

namespace Castor.Api.Shared;

/// <summary>
/// Word arithmetic for <see cref="PlaceholderLlmClient"/>: content words of a text cut to five-letter stems without
/// diacritics, so "samotność" and "samotnych" meet as "samot".
/// </summary>
internal static class PlaceholderText
{
    private const int StemLength = 5;

    private const int MinWordLength = 4;

    private static readonly HashSet<string> StopWords = new(StringComparer.Ordinal)
    {
        "ale", "aby", "albo", "bardzo", "bez", "bo", "bym", "być", "byc", "chce", "chcę", "czy", "dla", "do", "gdy",
        "jak", "jest", "jako", "jego", "jej", "już", "juz", "kiedy", "który", "która", "które", "którzy", "lub",
        "mam", "może", "moze", "mnie", "nas", "nasz", "nasze", "nie", "nic", "oraz", "ich", "się", "sie", "są",
        "tak", "także", "takze", "tego", "też", "tez", "tam", "ten", "to", "tylko", "przez", "przy", "pod", "nad",
        "jestem", "mają", "maja", "wiele", "wszystko", "gdzie", "tych", "tym", "była", "było", "były",
        "będzie", "bedzie", "można", "mozna", "jeszcze", "bardziej", "naszej", "naszym", "mojej", "moja", "mój",
    };

    public static List<string> ContentWords(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return [];
        }

        var words = new List<string>();
        var current = new StringBuilder();
        foreach (char character in text)
        {
            if (char.IsLetter(character))
            {
                current.Append(char.ToLower(character, CultureInfo.InvariantCulture));
                continue;
            }

            AddWord(words, current);
        }

        AddWord(words, current);
        return words;
    }

    public static HashSet<string> Stems(string? text)
    {
        return [.. ContentWords(text).Select(Stem)];
    }

    public static HashSet<string> Stems(IEnumerable<string?> texts)
    {
        return [.. texts.SelectMany(ContentWords).Select(Stem)];
    }

    public static string Stem(string word)
    {
        string plain = WithoutDiacritics(word);
        return plain.Length <= StemLength ? plain : plain[..StemLength];
    }

    /// <summary>The first sentences of a text, at most <paramref name="count"/>, each trimmed.</summary>
    public static List<string> Sentences(string? text, int count)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return [];
        }

        return [.. text
            .Split(['.', '!', '?', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(sentence => sentence.Length > 3)
            .Take(count)];
    }

    /// <summary>Comma-separated items of a list-like section ("Seniorzy, osoby z niepełnosprawnością, …").</summary>
    public static List<string> Items(string? text, int count)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return [];
        }

        return [.. text
            .Split([',', ';', '.'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(item => item.Length > 2)
            .Take(count)];
    }

    public static string Shorten(string? text, int maxLength)
    {
        string trimmed = text?.Trim() ?? string.Empty;
        if (trimmed.Length <= maxLength)
        {
            return trimmed;
        }

        string cut = trimmed[..(maxLength - 1)];
        int lastSpace = cut.LastIndexOf(' ');
        return (lastSpace > 0 ? cut[..lastSpace] : cut) + "…";
    }

    private static void AddWord(List<string> words, StringBuilder current)
    {
        if (current.Length >= MinWordLength)
        {
            string word = current.ToString();
            if (!StopWords.Contains(word))
            {
                words.Add(word);
            }
        }

        current.Clear();
    }

    private static string WithoutDiacritics(string word)
    {
        var plain = new StringBuilder(word.Length);
        foreach (char character in word)
        {
            char replaced = character switch
            {
                'ą' => 'a',
                'ć' => 'c',
                'ę' => 'e',
                'ł' => 'l',
                'ń' => 'n',
                'ó' => 'o',
                'ś' => 's',
                'ź' or 'ż' => 'z',
                _ => character,
            };
            plain.Append(replaced);
        }

        return plain.ToString();
    }
}
