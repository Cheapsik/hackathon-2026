namespace Castor.Api.Domain;

/// <summary>On whose side of a conversation a message was written.</summary>
public enum SenderRole
{
    /// <summary>The report's author or code holder, the asker, or the initiator of a partnership.</summary>
    INITIATOR,

    /// <summary>An expert of the conversation's challenge areas.</summary>
    EXPERT,

    /// <summary>An administrator (ROPS).</summary>
    ADMIN,

    /// <summary>An author or co-author of the idea a partnership's innovation grew from.</summary>
    INNOVATION_TEAM,
}
