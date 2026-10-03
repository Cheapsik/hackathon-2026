using System.Threading.Channels;

namespace Castor.Api.Shared;

/// <summary>
/// The in-process queue of job ids between whoever schedules a job and <see cref="BackgroundJobRunner"/>. The job
/// itself lives in the database; a restart loses only the queue, and the start-up marks such jobs failed.
/// </summary>
public sealed class BackgroundJobQueue
{
    private readonly Channel<Guid> channel = Channel.CreateUnbounded<Guid>(new UnboundedChannelOptions { SingleReader = true });

    public void Enqueue(Guid jobId)
    {
        bool written = channel.Writer.TryWrite(jobId);
        if (!written)
        {
            throw new InvalidOperationException($"Job {jobId} could not be queued.");
        }
    }

    public IAsyncEnumerable<Guid> ReadAllAsync(CancellationToken cancellationToken)
    {
        return channel.Reader.ReadAllAsync(cancellationToken);
    }
}
