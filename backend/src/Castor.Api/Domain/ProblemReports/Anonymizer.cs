using System.Text.RegularExpressions;

namespace Castor.Api.Domain;

/// <summary>
/// Removes personal data from what a person wrote before the text goes to a language model or is stored as a
/// report: e-mail addresses, PESEL numbers, phone numbers, street addresses and names of people. Regular expressions
/// and a list of common Polish first names, so it is approximate — it errs towards removing too much, and a rare
/// first name or a surname written alone can still slip through.
/// </summary>
public static partial class Anonymizer
{
    public const string PersonPlaceholder = "[OSOBA]";

    public const string EmailPlaceholder = "[EMAIL]";

    public const string PeselPlaceholder = "[PESEL]";

    public const string PhonePlaceholder = "[TELEFON]";

    public const string AddressPlaceholder = "[ADRES]";

    private static readonly string[] FirstNames =
    [
        "Ada", "Adam", "Adrian", "Adrianna", "Agata", "Agnieszka", "Aleksander", "Aleksandra", "Alicja", "Amelia",
        "Andrzej", "Aneta", "Aniela", "Anna", "Antoni", "Antonina", "Arkadiusz", "Artur", "Barbara", "Bartłomiej",
        "Bartosz", "Beata", "Bogdan", "Bogumiła", "Bogusław", "Bożena", "Bronisław", "Cezary", "Czesław", "Damian",
        "Daniel", "Danuta", "Dariusz", "Dawid", "Dominik", "Dominika", "Dorota", "Edward", "Edyta", "Elżbieta",
        "Emil", "Emilia", "Eugeniusz", "Ewa", "Ewelina", "Filip", "Franciszek", "Gabriel", "Gabriela", "Genowefa",
        "Grażyna", "Grzegorz", "Halina", "Hanna", "Helena", "Henryk", "Hubert", "Igor", "Irena", "Iwona", "Izabela",
        "Jacek", "Jadwiga", "Jakub", "Jan", "Janina", "Janusz", "Jarosław", "Jerzy", "Joanna", "Jolanta", "Józef",
        "Julia", "Julian", "Justyna", "Kacper", "Kamil", "Kamila", "Karol", "Karolina", "Katarzyna", "Kazimierz",
        "Kinga", "Klaudia", "Konrad", "Kornelia", "Krystian", "Krystyna", "Krzysztof", "Leon", "Leszek", "Lena",
        "Lucyna", "Ludwik", "Łucja", "Łukasz", "Maciej", "Magdalena", "Maja", "Malwina", "Małgorzata", "Marcin",
        "Marek", "Maria", "Marian", "Marianna", "Mariola", "Mariusz", "Marta", "Martyna", "Marzena", "Mateusz",
        "Michał", "Mieczysław", "Mikołaj", "Milena", "Mirosław", "Monika", "Natalia", "Nikola", "Norbert",
        "Oliwia", "Oliwier", "Olga", "Patrycja", "Patryk", "Paulina", "Paweł", "Piotr", "Przemysław", "Rafał",
        "Regina", "Renata", "Robert", "Roman", "Ryszard", "Sebastian", "Stanisław", "Stanisława", "Stefan",
        "Sylwia", "Szymon", "Tadeusz", "Teresa", "Tomasz", "Urszula", "Wanda", "Weronika", "Wiesław", "Wiesława",
        "Wiktor", "Wiktoria", "Wojciech", "Zbigniew", "Zdzisław", "Zenon", "Zofia", "Zuzanna", "Zygmunt",
    ];

    private static readonly Regex FirstNameWithSurname = BuildFirstNameRegex();

    public static string Anonymize(string text)
    {
        ArgumentNullException.ThrowIfNull(text);

        string withoutEmails = EmailRegex().Replace(text, EmailPlaceholder);
        string withoutPesel = PeselRegex().Replace(withoutEmails, PeselPlaceholder);
        string withoutPhones = PhoneRegex().Replace(withoutPesel, PhonePlaceholder);
        string withoutAddresses = AddressRegex().Replace(withoutPhones, AddressPlaceholder);
        string withoutAddressedPeople = AddressedPersonRegex().Replace(
            withoutAddresses,
            match => $"{match.Groups["title"].Value} {PersonPlaceholder}");

        return FirstNameWithSurname.Replace(withoutAddressedPeople, PersonPlaceholder);
    }

    /// <summary>
    /// A first name in the nominative or a common declined form (Anna, Anny, Annie; Jan, Janem; Marek, Marka),
    /// with an optional capitalized surname after it.
    /// </summary>
    private static Regex BuildFirstNameRegex()
    {
        IEnumerable<string> forms = FirstNames.Select(DeclinedForms);
        string alternatives = string.Join("|", forms);
        string pattern = $@"\b(?:{alternatives})(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ][\p{{Ll}}]+(?:-[A-ZĄĆĘŁŃÓŚŹŻ][\p{{Ll}}]+)?)?\b";

        return new Regex(pattern, RegexOptions.CultureInvariant | RegexOptions.Compiled);
    }

    private static string DeclinedForms(string name)
    {
        if (name.EndsWith('a'))
        {
            return $"{name[..^1]}(?:a|y|i|ie|ę|ą|o)";
        }

        if (name.EndsWith("ek", StringComparison.Ordinal))
        {
            return $"{name[..^2]}(?:ek|ka|kowi|kiem|ku)";
        }

        return $"{name}(?:a|owi|em|ie|u|ę)?";
    }

    [GeneratedRegex(@"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", RegexOptions.CultureInvariant)]
    private static partial Regex EmailRegex();

    [GeneratedRegex(@"(?<!\d)\d{11}(?!\d)", RegexOptions.CultureInvariant)]
    private static partial Regex PeselRegex();

    [GeneratedRegex(
        @"(?<![\d\w])(?:\+?48[\s-]?)?(?:\d{3}[\s-]?\d{3}[\s-]?\d{3}|\(?\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2})(?!\d)",
        RegexOptions.CultureInvariant)]
    private static partial Regex PhoneRegex();

    /// <summary>A street keyword followed by a capitalized name, so "plac zabaw" stays and "plac Wolności 3" goes.</summary>
    [GeneratedRegex(
        @"\b(?i:ul\.|ulic[aye]|al\.|alej[ai]|aleja|os\.|osiedl[eu]|pl\.|plac[u]?)\s*[A-ZĄĆĘŁŃÓŚŹŻ0-9][\p{L}.-]*(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ0-9][\p{L}.-]*){0,2}(?:\s*\d+[a-zA-Z]?(?:\s*/\s*\d+)?)?",
        RegexOptions.CultureInvariant)]
    private static partial Regex AddressRegex();

    [GeneratedRegex(
        @"\b(?<title>[Pp]an(?:i|a|u|em|ią|ie)?)\s+[A-ZĄĆĘŁŃÓŚŹŻ][\p{Ll}]+(?:-[A-ZĄĆĘŁŃÓŚŹŻ][\p{Ll}]+)?",
        RegexOptions.CultureInvariant)]
    private static partial Regex AddressedPersonRegex();
}
