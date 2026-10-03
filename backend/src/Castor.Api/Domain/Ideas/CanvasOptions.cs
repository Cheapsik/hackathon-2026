namespace Castor.Api.Domain;

/// <summary>
/// The fields of an idea card that are choices, with the words of the Social Innovation Canvas (ROPS, version 1.0 of
/// 5 May 2026; docs/LINKS.md). The Kreator shows them, the API checks codes against them and the language model reads
/// the labels.
/// </summary>
public static class CanvasOptions
{
    public const int ScaleMin = 1;

    public const int ScaleMax = 4;

    /// <summary>The Canvas asks for at most two or three values of each kind.</summary>
    public const int MaxValues = 3;

    /// <summary>How bad it is without the solution.</summary>
    public static readonly IReadOnlyList<CanvasScaleLevel> Intensity =
    [
        new(1, "Lekko przeszkadza", "Da się żyć, problem raczej irytuje niż blokuje."),
        new(2, "Utrudnia działanie", "Trzeba szukać alternatyw, traci się czas lub energię."),
        new(3, "Mocno przeszkadza", "Problem regularnie blokuje ważne działania."),
        new(4, "Bardzo poważny problem", "Powoduje stres, wykluczenie albo realną krzywdę."),
    ];

    public static readonly IReadOnlyList<CanvasScaleLevel> Frequency =
    [
        new(1, "Rzadko", "Raz na jakiś czas — raz w roku lub rzadziej."),
        new(2, "Czasami", "Kilka razy w roku lub miesiącu."),
        new(3, "Często", "Co tydzień lub regularnie."),
        new(4, "Bardzo często", "Codziennie albo prawie codziennie."),
    ];

    /// <summary>How many people the problem touches.</summary>
    public static readonly IReadOnlyList<CanvasScaleLevel> Scale =
    [
        new(1, "Pojedyncze osoby", "Dotyczy kilku osób lub małej grupy."),
        new(2, "Wąska grupa", "Dotyczy konkretnej społeczności, np. uczniów jednej szkoły, ludzi z jednej okolicy, załogi konkretnej instytucji."),
        new(3, "Duża grupa", "Dotyczy wielu osób w mieście, regionie, branży lub większej społeczności."),
        new(4, "Bardzo szeroka grupa", "Dotyczy dużej części społeczeństwa albo wielu podobnych grup w różnych miejscach."),
    ];

    /// <summary>Who the solution is meant to help.</summary>
    public static readonly IReadOnlyList<CanvasOption> Recipients =
    [
        new("CHILDREN", "dzieci", null),
        new("YOUTH", "młodzież", null),
        new("PARENTS", "rodzice", null),
        new("SENIORS", "seniorzy", null),
        new("PEOPLE_WITH_DISABILITIES", "osoby z niepełnosprawnościami", null),
        new("TEACHERS", "nauczyciele", null),
        new("INSTITUTION_STAFF", "pracownicy instytucji", null),
        new("PEOPLE_IN_CRISIS", "osoby w kryzysie", null),
        new("SOCIAL_ORGANIZATIONS", "organizacje społeczne", null),
        new("LOCAL_RESIDENTS", "mieszkańcy konkretnego miejsca", null),
    ];

    /// <summary>What the recipients will feel thanks to the solution.</summary>
    public static readonly IReadOnlyList<CanvasOption> EmotionalValues =
    [
        new("SAFETY", "bezpieczeństwo", null),
        new("INDEPENDENCE", "niezależność", null),
        new("CALM", "spokój", null),
        new("MOTIVATION", "motywacja", null),
        new("CONFIDENCE", "pewność", null),
        new("SOCIAL_INCLUSION", "włączenie społeczne", null),
        new("LESS_LONELINESS", "zmniejszenie samotności", null),
        new("BEING_SEEN", "poczucie bycia widzianym", null),
        new("AGENCY", "większa sprawczość", null),
        new("BETTER_MOOD", "poprawa nastroju", null),
        new("BETTER_HEALTH", "poprawa stanu zdrowia", null),
        new("LIFE_SATISFACTION", "większe zadowolenie z życia", null),
    ];

    /// <summary>What the solution concretely improves.</summary>
    public static readonly IReadOnlyList<CanvasOption> FunctionalValues =
    [
        new("LOWER_COSTS", "obniża koszty", null),
        new("WIDER_REACH", "zwiększa zasięg pomocy", null),
        new("SAVES_TIME", "oszczędza czas", null),
        new("LESS_BURDEN", "zmniejsza obciążenie", null),
        new("MORE_EFFECTIVE", "zwiększa skuteczność", null),
        new("SAFER", "poprawia bezpieczeństwo", null),
        new("BETTER_QUALITY", "poprawia jakość", null),
        new("SOCIAL_IMPACT", "zwiększa wpływ społeczny", null),
        new("SIMPLER_PROCESS", "upraszcza proces", null),
        new("LESS_ENVIRONMENTAL_HARM", "ogranicza negatywny wpływ na środowisko", null),
        new("MORE_ACCESSIBLE", "zwiększa dostępność", null),
        new("BETTER_DECISIONS", "pomaga w podejmowaniu lepszych decyzji", null),
    ];

    /// <summary>Readiness for implementation; the codes are <see cref="InnovationStage"/>.</summary>
    public static readonly IReadOnlyList<CanvasOption> Stages =
    [
        new(nameof(InnovationStage.IDEA), "Pomysł", "Mamy koncepcję, ale rozwiązanie nie zostało jeszcze sprawdzone z odbiorcami."),
        new(nameof(InnovationStage.PROTOTYPE), "Prototyp", "Mamy pierwszą wersję rozwiązania, jednak wciąż wymaga ona testów i dopracowania."),
        new(nameof(InnovationStage.TESTED), "Przetestowane rozwiązanie", "Rozwiązanie zostało sprawdzone z realnymi użytkownikami i wiemy, co trzeba poprawić."),
        new(nameof(InnovationStage.READY), "Gotowe do wdrożenia", "Rozwiązanie można uruchomić w rzeczywistym miejscu, z prawdziwymi odbiorcami i znanymi zasobami."),
    ];

    public static string LabelOf(IReadOnlyList<CanvasScaleLevel> scale, int level)
    {
        ArgumentNullException.ThrowIfNull(scale);

        return scale.Single(step => step.Level == level).Label;
    }

    public static string LabelOf(IReadOnlyList<CanvasOption> options, string code)
    {
        ArgumentNullException.ThrowIfNull(options);

        return options.Single(option => option.Code == code).Label;
    }
}
