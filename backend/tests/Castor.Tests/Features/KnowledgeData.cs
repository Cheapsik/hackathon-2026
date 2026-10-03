namespace Castor.Tests;

/// <summary>Innovations and gminy for a test, written through the domain's own factories.</summary>
internal static class KnowledgeData
{
    private static readonly DateTimeOffset CreatedAt = new(2026, 10, 3, 12, 0, 0, TimeSpan.Zero);

    /// <summary>An innovation about lonely seniors, with a draft genome, so matching has a candidate to rank.</summary>
    public static async Task<Guid> AddInnovationWithGenomeAsync(ApiFactory factory, string title)
    {
        Innovation innovation = NewInnovation(title);
        var genome = InnovationGenome.Draft(
            innovation,
            ["samotność seniorów"],
            ["spotkania sąsiedzkie w świetlicy"],
            ["seniorzy"],
            RequiredResources.Describe([], [], null, []),
            null,
            [],
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
            db.Innovations.AddRange(titles.Select(NewInnovation));
            await db.SaveChangesAsync();
        });
    }

    public static async Task AddMunicipalitiesAsync(ApiFactory factory, params string[] names)
    {
        await TestApi.WithDatabaseAsync(factory, async db =>
        {
            int number = 0;
            foreach (string name in names)
            {
                number++;
                string teryt = $"12060{number:00}";
                db.Municipalities.Add(Municipality.Register(teryt, name, MunicipalityType.RURAL, "gorlicki", CreatedAt));
            }

            await db.SaveChangesAsync();
        });
    }

    private static Innovation NewInnovation(string title)
    {
        var sections = new InnovationCardSections(
            $"{title}: spotkania sąsiedzkie dla samotnych seniorów w świetlicy.",
            "Samotność seniorów",
            "Seniorzy",
            null,
            null);
        var links = new InnovationLinks(null, null, null, null, null);

        return Innovation.Create(title, "Spotkania dla seniorów.", [], sections, null, links, InnovationStage.READY, CreatedAt);
    }
}
