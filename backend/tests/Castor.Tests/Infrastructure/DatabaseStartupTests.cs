namespace Castor.Tests;

[Collection(PostgresCollection.Name)]
public sealed class DatabaseStartupTests(PostgresFixture postgres)
{
    /// <summary>appsettings.json holds an empty path; it must not quietly resolve to the content root.</summary>
    [Fact]
    public async Task A_seed_import_without_a_path_stops_the_start_up_and_says_so()
    {
        string connectionString = await postgres.CreateMigratedDatabaseAsync();
        var settings = new Dictionary<string, string?>
        {
            ["Seed:OnStartup"] = "true",
            ["Seed:Path"] = string.Empty,
        };
        await using var factory = new ApiFactory(connectionString, settings);

        Exception? startUp = Record.Exception(() => factory.CreateClient());

        Assert.NotNull(startUp);
        Assert.Contains("Seed:Path is not set", startUp.ToString(), StringComparison.Ordinal);
    }
}
