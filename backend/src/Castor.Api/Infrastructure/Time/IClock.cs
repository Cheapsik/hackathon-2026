namespace Castor.Api.Infrastructure;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}
