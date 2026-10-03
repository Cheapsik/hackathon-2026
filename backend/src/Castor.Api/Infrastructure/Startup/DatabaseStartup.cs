using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Infrastructure;

/// <summary>
/// Brings the database to a working state when the application starts, before it serves requests: migrations (in the
/// container), the bootstrap administrator, failing jobs the last shutdown cut off, and the seed import. A hosted service rather than code after
/// <c>Build()</c>, because the build-time OpenAPI generator and dotnet-ef build the host without starting it — they
/// must not touch a database.
/// </summary>
public sealed class DatabaseStartup(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    IHostEnvironment environment) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
        IServiceProvider services = scope.ServiceProvider;

        // The demo container brings its own schema up; locally the team runs dotnet-ef database update.
        if (configuration.GetValue<bool>("Database:MigrateOnStartup"))
        {
            CastorDbContext db = services.GetRequiredService<CastorDbContext>();
            await db.Database.MigrateAsync(cancellationToken);
        }

        AdminBootstrap adminBootstrap = services.GetRequiredService<AdminBootstrap>();
        await adminBootstrap.EnsureAsync(cancellationToken);

        BackgroundJobScheduler jobs = services.GetRequiredService<BackgroundJobScheduler>();
        await jobs.FailInterruptedAsync(cancellationToken);

        if (configuration.GetValue<bool>("Seed:OnStartup"))
        {
            string seedPath = configuration["Seed:Path"]
                ?? throw new InvalidOperationException("Seed:OnStartup is true but Seed:Path is not set.");
            string fullSeedPath = Path.GetFullPath(seedPath, environment.ContentRootPath);
            SeedImporter importer = services.GetRequiredService<SeedImporter>();
            await importer.ImportAsync(fullSeedPath, cancellationToken);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
