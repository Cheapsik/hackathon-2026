namespace Castor.Api.Domain;

/// <summary>"Czy to spełnia Twoją potrzebę?" — the one decision after a similar report or a matched innovation.</summary>
public enum Verdict
{
    /// <summary>"To nie to".</summary>
    NO,

    /// <summary>"To moja sprawa" under a similar report (joins its case), "To mi pomogło" under an innovation.</summary>
    YES,

    /// <summary>"Prawie — brakuje mi…": always with a note on what differs or is missing.</summary>
    ALMOST,
}
