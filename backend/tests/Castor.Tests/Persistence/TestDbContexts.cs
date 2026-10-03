using Microsoft.EntityFrameworkCore;

namespace Castor.Tests;

internal static class TestDbContexts
{
    /// <summary>Building a model needs a provider, not a reachable server.</summary>
    private const string ModelOnlyConnectionString = "Host=localhost;Database=model_only";

    public static CastorDbContext Production(string connectionString)
    {
        DbContextOptions<CastorDbContext> options = new DbContextOptionsBuilder<CastorDbContext>()
            .UseNpgsql(connectionString, npgsql => npgsql.UseVector())
            .Options;

        return new CastorDbContext(options);
    }

    public static CastorDbContext ProductionModel()
    {
        return Production(ModelOnlyConnectionString);
    }
}
