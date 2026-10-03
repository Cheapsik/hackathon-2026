using Microsoft.EntityFrameworkCore;
using Npgsql;
using Testcontainers.PostgreSql;

namespace Castor.Tests;

/// <summary>
/// One real PostgreSQL 17 instance shared by the integration tests; every test gets its own database. The same image
/// as docker-compose.yml, because the migrations need pgvector.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer container = new PostgreSqlBuilder("pgvector/pgvector:pg17")
        .WithCommand("-c", "max_connections=1000")
        .Build();

    public Task InitializeAsync()
    {
        return container.StartAsync();
    }

    public Task DisposeAsync()
    {
        return container.DisposeAsync().AsTask();
    }

    public async Task<string> CreateMigratedDatabaseAsync()
    {
        string databaseName = $"test_{Guid.CreateVersion7():n}";
        string serverConnectionString = container.GetConnectionString();

        await using (var connection = new NpgsqlConnection(serverConnectionString))
        {
            await connection.OpenAsync();
            await using var command = new NpgsqlCommand($"""CREATE DATABASE "{databaseName}" """, connection);
            await command.ExecuteNonQueryAsync();
        }

        string connectionString = new NpgsqlConnectionStringBuilder(serverConnectionString)
        {
            Database = databaseName,
        }.ConnectionString;

        await using CastorDbContext context = TestDbContexts.Production(connectionString);
        await context.Database.MigrateAsync();

        return connectionString;
    }
}
