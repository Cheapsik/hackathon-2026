using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Persistence;

/// <summary>The one context of the application, with every table of the model.</summary>
public sealed class CastorDbContext : DbContext
{
    public CastorDbContext(DbContextOptions<CastorDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        ModelConventions.ApplyTo(configurationBuilder);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // vector: embeddings of genomes and report chunks. unaccent and pg_trgm: Polish full-text search, for
        // which PostgreSQL ships no dictionary — the 'simple' configuration without diacritics plus trigram similarity.
        modelBuilder.HasPostgresExtension("vector");
        modelBuilder.HasPostgresExtension("unaccent");
        modelBuilder.HasPostgresExtension("pg_trgm");

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CastorDbContext).Assembly);
        ModelConventions.ApplyTo(modelBuilder);
    }
}
