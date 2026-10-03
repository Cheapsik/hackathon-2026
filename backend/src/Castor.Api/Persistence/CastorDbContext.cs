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
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CastorDbContext).Assembly);
        ModelConventions.ApplyTo(modelBuilder);
    }
}
