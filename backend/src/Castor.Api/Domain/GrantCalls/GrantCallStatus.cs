namespace Castor.Api.Domain;

public enum GrantCallStatus
{
    /// <summary>In preparation, e.g. a draft written by the assistant from a blank spot; only administrators see it.</summary>
    DRAFT,

    /// <summary>Open: the grant application generator of the Kreator works for it (SPEC 7 III).</summary>
    OPEN,

    CLOSED,
}
