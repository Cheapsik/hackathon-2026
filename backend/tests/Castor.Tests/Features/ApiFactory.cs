using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Castor.Tests;

internal sealed class ApiFactory(string connectionString) : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Castor", connectionString);
        builder.UseSetting("Logging:LogLevel:Default", "Warning");
        builder.UseEnvironment("Development");
    }
}
