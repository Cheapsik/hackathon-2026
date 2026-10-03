using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Castor.Api.Persistence;

public static class PostgresErrors
{
    public const string UniqueViolation = "23505";

    public static bool IsUniqueViolation(DbUpdateException exception)
    {
        return exception.InnerException is PostgresException postgres
            && postgres.SqlState == UniqueViolation;
    }
}
