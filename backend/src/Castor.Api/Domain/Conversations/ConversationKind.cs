namespace Castor.Api.Domain;

/// <summary>What a conversation is about, which decides who takes part in it (SPEC 7 V).</summary>
public enum ConversationKind
{
    /// <summary>The thread of one problem report: its author or code holder, administrators, experts of its areas.</summary>
    PROBLEM_REPORT,

    /// <summary>A question to the experts of one challenge area: the asker, those experts, administrators.</summary>
    EXPERT_QUESTION,

    /// <summary>A partnership proposal about an innovation: the initiator and administrators, who mediate.</summary>
    PARTNERSHIP,
}
