using System.Linq.Expressions;

namespace Castor.Api.Domain;

/// <summary>
/// A conversation of the platform (SPEC 7 V). A problem report has exactly one, created with it; a question to the
/// experts of an area and a partnership proposal about an innovation are started by a signed-in user. Administrators
/// take part in every conversation. Messages are human to human and never reach a language model, so they are stored
/// as written.
/// </summary>
public sealed class Conversation
{
    public const int SubjectMaxLength = 200;

    private Conversation()
    {
    }

    public Guid Id { get; private set; }

    public ConversationKind Kind { get; private set; }

    /// <summary>Only for <see cref="ConversationKind.PROBLEM_REPORT"/>.</summary>
    public Guid? ProblemReportId { get; private set; }

    public ProblemReport? ProblemReport { get; private set; }

    /// <summary>Only for <see cref="ConversationKind.EXPERT_QUESTION"/>: the area whose experts answer.</summary>
    public string? ChallengeAreaCode { get; private set; }

    public ChallengeArea? ChallengeArea { get; private set; }

    /// <summary>Only for <see cref="ConversationKind.PARTNERSHIP"/>.</summary>
    public Guid? InnovationId { get; private set; }

    public Innovation? Innovation { get; private set; }

    /// <summary>
    /// The user who started a question or a partnership. Null for a report's thread: its initiator is the report's
    /// author or code holder, which can change when the report is claimed.
    /// </summary>
    public Guid? InitiatorId { get; private set; }

    /// <summary>Null for a report's thread, which is about the report itself.</summary>
    public string? Subject { get; private set; }

    /// <summary>Null until the first message.</summary>
    public DateTimeOffset? LastMessageAt { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    /// <summary>
    /// The conversations a reader may open: administrators all of them; a signed-in user those they started; for a
    /// report's thread its author and code holder; experts the threads and questions of their areas. An expression,
    /// so lists filter in the database by the same rule. In memory it needs <see cref="ProblemReport"/> loaded.
    /// </summary>
    public static Expression<Func<Conversation, bool>> VisibleTo(ConversationReader reader)
    {
        ArgumentNullException.ThrowIfNull(reader);

        Guid? userId = reader.UserId;
        bool isAdmin = reader.IsAdmin;
        string[] expertAreas = reader.ExpertChallengeAreaCodes;
        string? trackingCode = reader.TrackingCode;

        return conversation => isAdmin
            || (userId != null && conversation.InitiatorId == userId)
            || (conversation.ProblemReport != null
                && ((userId != null && conversation.ProblemReport.AuthorId == userId)
                    || (trackingCode != null && conversation.ProblemReport.TrackingCode == trackingCode)
                    || conversation.ProblemReport.ChallengeAreaCodes.Any(code => expertAreas.Contains(code))))
            || (conversation.ChallengeAreaCode != null && expertAreas.Contains(conversation.ChallengeAreaCode));
    }

    public static Conversation ForProblemReport(ProblemReport report, DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(report);

        return new Conversation
        {
            Id = Guid.CreateVersion7(),
            Kind = ConversationKind.PROBLEM_REPORT,
            ProblemReportId = report.Id,
            ProblemReport = report,
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
        };
    }

    public static Conversation AskExperts(Guid askerId, ChallengeArea challengeArea, string? subject, DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(challengeArea);

        if (askerId == Guid.Empty)
        {
            throw new InvalidOperationException("The asker of a new expert question has an empty id.");
        }

        return new Conversation
        {
            Id = Guid.CreateVersion7(),
            Kind = ConversationKind.EXPERT_QUESTION,
            ChallengeAreaCode = challengeArea.Code,
            ChallengeArea = challengeArea,
            InitiatorId = askerId,
            Subject = EnsureSubject(subject),
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
        };
    }

    public static Conversation ProposePartnership(Guid initiatorId, Innovation innovation, string? subject, DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(innovation);

        if (initiatorId == Guid.Empty)
        {
            throw new InvalidOperationException("The initiator of a new partnership has an empty id.");
        }

        return new Conversation
        {
            Id = Guid.CreateVersion7(),
            Kind = ConversationKind.PARTNERSHIP,
            InnovationId = innovation.Id,
            Innovation = innovation,
            InitiatorId = initiatorId,
            Subject = EnsureSubject(subject),
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
        };
    }

    /// <summary>
    /// The side the reader writes on, or null when the reader takes no part. An administrator always writes as
    /// <see cref="SenderRole.ADMIN"/>; whoever started the conversation (or holds the report) as
    /// <see cref="SenderRole.INITIATOR"/>, before being an expert. Needs <see cref="ProblemReport"/> loaded.
    /// </summary>
    public SenderRole? SenderRoleOf(ConversationReader reader)
    {
        ArgumentNullException.ThrowIfNull(reader);
        EnsureReportLoaded();

        if (reader.IsAdmin)
        {
            return SenderRole.ADMIN;
        }

        if (IsInitiator(reader))
        {
            return SenderRole.INITIATOR;
        }

        IReadOnlyList<string> areas = ExpertAreaCodes();
        bool isAreaExpert = areas.Any(reader.ExpertChallengeAreaCodes.Contains);
        return isAreaExpert ? SenderRole.EXPERT : null;
    }

    /// <summary>The challenge areas whose experts take part. Needs <see cref="ProblemReport"/> loaded.</summary>
    public IReadOnlyList<string> ExpertAreaCodes()
    {
        EnsureReportLoaded();

        if (ProblemReport is not null)
        {
            return ProblemReport.ChallengeAreaCodes;
        }

        if (ChallengeAreaCode is not null)
        {
            return [ChallengeAreaCode];
        }

        return [];
    }

    /// <summary>A closed report takes no more messages; its thread stays readable. Needs <see cref="ProblemReport"/> loaded.</summary>
    public bool AcceptsMessages()
    {
        EnsureReportLoaded();

        return ProblemReport?.Status != ProblemReportStatus.CLOSED;
    }

    /// <param name="authorId">The signed-in author; null for a visitor writing with the report's tracking code.</param>
    public Message Post(SenderRole senderRole, Guid? authorId, string? text, DateTimeOffset postedAt)
    {
        if (!AcceptsMessages())
        {
            throw new DomainException("The report is closed; its thread takes no more messages.", StatusCodes.Status409Conflict);
        }

        if (authorId is null && (senderRole != SenderRole.INITIATOR || Kind != ConversationKind.PROBLEM_REPORT))
        {
            throw new InvalidOperationException("Only the holder of a report's tracking code writes without an account.");
        }

        var message = Message.Write(this, senderRole, authorId, text, postedAt);
        LastMessageAt = postedAt;
        UpdatedAt = postedAt;
        return message;
    }

    private static string EnsureSubject(string? subject)
    {
        string trimmed = subject?.Trim() ?? string.Empty;
        if (trimmed.Length == 0)
        {
            throw new DomainException("A conversation needs a subject.");
        }

        if (trimmed.Length > SubjectMaxLength)
        {
            throw new DomainException($"A subject has at most {SubjectMaxLength} characters.");
        }

        return trimmed;
    }

    private bool IsInitiator(ConversationReader reader)
    {
        if (reader.UserId is not null && InitiatorId == reader.UserId)
        {
            return true;
        }

        if (ProblemReport is null)
        {
            return false;
        }

        return (reader.UserId is not null && ProblemReport.AuthorId == reader.UserId)
            || (reader.TrackingCode is not null && ProblemReport.TrackingCode == reader.TrackingCode);
    }

    private void EnsureReportLoaded()
    {
        if (Kind == ConversationKind.PROBLEM_REPORT && ProblemReport is null)
        {
            throw new InvalidOperationException($"Conversation {Id} was loaded without its problem report.");
        }
    }
}
