namespace Castor.Tests;

/// <summary>Innovations and gminy for a test, written through the domain's own factories.</summary>
internal static class KnowledgeData
{
    private static readonly DateTimeOffset CreatedAt = new(2026, 10, 3, 12, 0, 0, TimeSpan.Zero);

    /// <summary>
    /// An innovation about lonely seniors, with a draft genome, so matching has a candidate to rank. The genome names
    /// <paramref name="challengeAreas"/>.
    /// </summary>
    public static async Task<Guid> AddInnovationWithGenomeAsync(ApiFactory factory, string title, params ChallengeArea[] challengeAreas)
    {
        Innovation innovation = NewInnovation(title);
        var genome = InnovationGenome.Draft(
            innovation,
            ["samotność seniorów"],
            ["spotkania sąsiedzkie w świetlicy"],
            ["seniorzy"],
            RequiredResources.Describe([], [], null, []),
            null,
            challengeAreas,
            "Świetlica, w której samotni seniorzy spotykają sąsiadów.",
            CreatedAt);

        await TestApi.WithDatabaseAsync(factory, async db =>
        {
            db.Innovations.Add(innovation);
            db.InnovationGenomes.Add(genome);
            await db.SaveChangesAsync();
        });

        return innovation.Id;
    }

    public static async Task AddInnovationsWithoutGenomeAsync(ApiFactory factory, params string[] titles)
    {
        await TestApi.WithDatabaseAsync(factory, async db =>
        {
            db.Innovations.AddRange(titles.Select(title => NewInnovation(title)));
            await db.SaveChangesAsync();
        });
    }

    /// <summary>An innovation without a genome at <paramref name="stage"/>, e.g. a prototype that may look for testers.</summary>
    public static async Task<Guid> AddInnovationAsync(ApiFactory factory, string title, InnovationStage stage)
    {
        Innovation innovation = NewInnovation(title, stage);
        await TestApi.WithDatabaseAsync(factory, async db =>
        {
            db.Innovations.Add(innovation);
            await db.SaveChangesAsync();
        });

        return innovation.Id;
    }

    public static async Task<ChallengeArea> AddChallengeAreaAsync(ApiFactory factory, string code, int number)
    {
        var area = ChallengeArea.Import(code, number, $"Obszar {code}", "Obszar wyzwań do testów.", [], "test", CreatedAt);
        await TestApi.WithDatabaseAsync(factory, async db =>
        {
            db.ChallengeAreas.Add(area);
            await db.SaveChangesAsync();
        });

        return area;
    }

    /// <summary>
    /// An Obserwator indicator with its <paramref name="figures"/>; general (context of every gmina) when it names no
    /// challenge area.
    /// </summary>
    public static async Task AddIndicatorAsync(
        ApiFactory factory,
        int observerId,
        string name,
        IReadOnlyList<string> challengeAreaCodes,
        params IndicatorFigure[] figures)
    {
        var indicator = Indicator.Register(observerId, CreatedAt);
        indicator.UpdateFromRegister(name, "LUDNOŚĆ", null, null, "%", challengeAreaCodes, challengeAreaCodes.Count == 0, CreatedAt);

        await TestApi.WithDatabaseAsync(factory, async db =>
        {
            db.Indicators.Add(indicator);
            db.IndicatorValues.AddRange(figures.Select(figure =>
                IndicatorValue.Record(indicator, figure.Level, figure.TerritoryCode, figure.Year, new Measure(figure.Value), CreatedAt)));
            await db.SaveChangesAsync();
        });
    }

    /// <summary>Gminy of one powiat (TERYT 1206); returns their TERYT codes in the order of <paramref name="names"/>.</summary>
    public static async Task<IReadOnlyList<string>> AddMunicipalitiesAsync(ApiFactory factory, params string[] names)
    {
        List<string> teryts = [.. names.Select((_, index) => $"12060{index + 1:00}")];
        await TestApi.WithDatabaseAsync(factory, async db =>
        {
            for (int index = 0; index < names.Length; index++)
            {
                db.Municipalities.Add(Municipality.Register(teryts[index], names[index], MunicipalityType.RURAL, "gorlicki", CreatedAt));
            }

            await db.SaveChangesAsync();
        });

        return teryts;
    }

    private static Innovation NewInnovation(string title, InnovationStage stage = InnovationStage.READY)
    {
        var sections = new InnovationCardSections(
            $"{title}: spotkania sąsiedzkie dla samotnych seniorów w świetlicy.",
            "Samotność seniorów",
            "Seniorzy",
            null,
            null);
        var links = new InnovationLinks(null, null, null, null, null);

        return Innovation.Create(title, "Spotkania dla seniorów.", [], sections, null, links, stage, CreatedAt);
    }
}
