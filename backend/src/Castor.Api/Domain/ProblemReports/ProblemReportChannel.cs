namespace Castor.Api.Domain;

public enum ProblemReportChannel
{
    TEXT,

    /// <summary>Dictated with the microphone.</summary>
    VOICE,

    /// <summary>Submitted by someone on behalf of another person.</summary>
    ASSISTED,
}
