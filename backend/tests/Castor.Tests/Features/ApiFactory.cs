using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Castor.Tests;

/// <summary>
/// The API on its own database, without the seed: each test adds the data it needs, and the full seed would queue
/// genomes for the whole library. <paramref name="settings"/> override configuration; <paramref name="configureServices"/>
/// replaces services, e.g. the language model.
/// </summary>
internal sealed class ApiFactory(
    string connectionString,
    IReadOnlyDictionary<string, string?>? settings = null,
    Action<IServiceCollection>? configureServices = null) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Castor", connectionString);
        builder.UseSetting("Logging:LogLevel:Default", "Warning");
        builder.UseSetting("Seed:OnStartup", "false");
        builder.UseSetting("Bootstrap:AdminEmail", TestApi.AdminEmail);
        builder.UseSetting("Bootstrap:AdminPassword", TestApi.AdminPassword);

        foreach (KeyValuePair<string, string?> setting in settings ?? new Dictionary<string, string?>())
        {
            builder.UseSetting(setting.Key, setting.Value);
        }

        builder.UseEnvironment("Development");

        if (configureServices is not null)
        {
            builder.ConfigureTestServices(configureServices);
        }
    }
}
