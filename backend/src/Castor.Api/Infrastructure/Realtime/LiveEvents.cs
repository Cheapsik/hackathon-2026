namespace Castor.Api.Infrastructure;

/// <summary>Names of the events <see cref="LiveHub"/> sends; the frontend listens for the same strings.</summary>
public static class LiveEvents
{
    public const string ProblemReportCreated = "ProblemReportCreated";

    public const string ProblemReportStatusChanged = "ProblemReportStatusChanged";
}
