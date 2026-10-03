namespace Castor.Api.Domain;

/// <summary>
/// A long operation run in the process (genomes for the whole library, report embeddings), with its progress for the
/// administrator's panel. Every job is idempotent, so one interrupted by a restart is marked failed and can run again.
/// </summary>
public sealed class BackgroundJob
{
    public const int ErrorMaxLength = 2000;

    private BackgroundJob()
    {
    }

    public Guid Id { get; private set; }

    public BackgroundJobKind Kind { get; private set; }

    public BackgroundJobStatus Status { get; private set; }

    /// <summary>The number of items to process; null until the job starts and counts them.</summary>
    public int? Total { get; private set; }

    public int Done { get; private set; }

    /// <summary>Items that could not be processed; the job goes on with the next one.</summary>
    public int Failed { get; private set; }

    public string? Error { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset? StartedAt { get; private set; }

    public DateTimeOffset? FinishedAt { get; private set; }

    public bool IsFinished => Status is BackgroundJobStatus.SUCCEEDED or BackgroundJobStatus.FAILED;

    public static BackgroundJob Queue(BackgroundJobKind kind, DateTimeOffset queuedAt)
    {
        return new BackgroundJob
        {
            Id = Guid.CreateVersion7(),
            Kind = kind,
            Status = BackgroundJobStatus.QUEUED,
            CreatedAt = queuedAt,
        };
    }

    public void Start(int total, DateTimeOffset startedAt)
    {
        if (Status != BackgroundJobStatus.QUEUED)
        {
            throw new InvalidOperationException($"Job {Id} is {Status} and cannot start.");
        }

        Status = BackgroundJobStatus.RUNNING;
        Total = total;
        StartedAt = startedAt;
    }

    public void RecordItem(bool succeeded)
    {
        EnsureRunning();

        if (succeeded)
        {
            Done++;
        }
        else
        {
            Failed++;
        }
    }

    public void Succeed(DateTimeOffset finishedAt)
    {
        EnsureRunning();

        Status = BackgroundJobStatus.SUCCEEDED;
        FinishedAt = finishedAt;
    }

    /// <summary>Also for a job the process left behind: a restart marks every unfinished job failed.</summary>
    public void Fail(string error, DateTimeOffset finishedAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(error);

        if (IsFinished)
        {
            throw new InvalidOperationException($"Job {Id} is already {Status}.");
        }

        Status = BackgroundJobStatus.FAILED;
        Error = error.Length > ErrorMaxLength ? error[..ErrorMaxLength] : error;
        FinishedAt = finishedAt;
    }

    private void EnsureRunning()
    {
        if (Status != BackgroundJobStatus.RUNNING)
        {
            throw new InvalidOperationException($"Job {Id} is {Status}, not running.");
        }
    }
}
