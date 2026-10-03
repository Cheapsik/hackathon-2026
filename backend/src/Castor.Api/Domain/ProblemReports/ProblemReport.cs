using System.Text;

namespace Castor.Api.Domain;

/// <summary>
/// A problem described by a resident, an organization or a gmina, with an account or anonymously. It exists from the
/// moment it is sent (<see cref="ProblemReportStatus.RECEIVED"/>); classification may add up to three clarifying
/// questions, and matching runs once the questions are answered or skipped. Only the anonymized text is kept for
/// processing; the original is kept only with the author's consent.
/// </summary>
public sealed class ProblemReport
{
    public const int DescriptionMinLength = 20;

    public const int DescriptionMaxLength = 3000;

    /// <summary>Room for the anonymizer's placeholders, which are longer than what they replace.</summary>
    public const int StoredDescriptionMaxLength = 2 * DescriptionMaxLength;

    public const int AnswerMaxLength = 500;

    public const int MaxClarifyingQuestions = 3;

    public const int ReplyDraftMaxLength = 4000;

    private ProblemReport()
    {
    }

    public Guid Id { get; private set; }

    /// <summary>Normalized, without the dash — see <see cref="Domain.TrackingCode"/>.</summary>
    public string TrackingCode { get; private set; } = null!;

    /// <summary>The description after anonymization: the only text that reaches a language model.</summary>
    public string Description { get; private set; } = null!;

    /// <summary>The description as written; kept only when the author agreed. Visible to the author and administrators.</summary>
    public string? OriginalDescription { get; private set; }

    public Guid? MunicipalityId { get; private set; }

    public Municipality? Municipality { get; private set; }

    public ProblemReportChannel Channel { get; private set; }

    public bool SubmittedOnBehalf { get; private set; }

    public ProblemReportStatus Status { get; private set; }

    /// <summary>Null for an anonymous report until a signed-in user claims it with its code.</summary>
    public Guid? AuthorId { get; private set; }

    /// <summary>Codes of challenge areas from classification; the first one is the main area.</summary>
    public List<string> ChallengeAreaCodes { get; private set; } = [];

    public List<string> RootCauses { get; private set; } = [];

    public string? TargetGroup { get; private set; }

    /// <summary>From classification; null for a report classified before urgency existed.</summary>
    public ProblemReportUrgency? Urgency { get; private set; }

    /// <summary>The administrators' reply in preparation; sent from the report's thread (module V).</summary>
    public string? ReplyDraft { get; private set; }

    public DateTimeOffset? ReplyDraftUpdatedAt { get; private set; }

    /// <summary>Base forms and synonyms from classification, for full-text search.</summary>
    public List<string> Keywords { get; private set; } = [];

    public List<ClarifyingQuestion> ClarifyingQuestions { get; private set; } = [];

    public DateTimeOffset? ClassifiedAt { get; private set; }

    /// <summary>When the questions were answered or skipped; set at classification when there were none.</summary>
    public DateTimeOffset? QuestionsSettledAt { get; private set; }

    public DateTimeOffset? MatchedAt { get; private set; }

    public DateTimeOffset? ClaimedAt { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public bool AwaitsAnswers => ClassifiedAt is not null && QuestionsSettledAt is null;

    public bool IsReadyForMatching => ClassifiedAt is not null && QuestionsSettledAt is not null && MatchedAt is null;

    public string? MainChallengeAreaCode => ChallengeAreaCodes.Count > 0 ? ChallengeAreaCodes[0] : null;

    /// <param name="dictated">The description was dictated with the microphone.</param>
    /// <param name="authorId">The signed-in author; null for an anonymous report.</param>
    public static ProblemReport Submit(
        string? description,
        Municipality? municipality,
        bool submittedOnBehalf,
        bool dictated,
        bool keepOriginalDescription,
        Guid? authorId,
        string trackingCode,
        DateTimeOffset submittedAt)
    {
        if (authorId == Guid.Empty)
        {
            throw new InvalidOperationException("The author id of a new problem report is empty.");
        }

        if (Domain.TrackingCode.Normalize(trackingCode) != trackingCode)
        {
            throw new InvalidOperationException("A new problem report needs a generated tracking code.");
        }

        string trimmed = EnsureDescription(description);
        string anonymized = Anonymizer.Anonymize(trimmed);

        return new ProblemReport
        {
            Id = Guid.CreateVersion7(),
            TrackingCode = trackingCode,
            Description = anonymized,
            OriginalDescription = keepOriginalDescription ? trimmed : null,
            MunicipalityId = municipality?.Id,
            Municipality = municipality,
            Channel = ChannelOf(submittedOnBehalf, dictated),
            SubmittedOnBehalf = submittedOnBehalf,
            Status = ProblemReportStatus.RECEIVED,
            AuthorId = authorId,
            CreatedAt = submittedAt,
            UpdatedAt = submittedAt,
        };
    }

    /// <summary>
    /// Records what classification found. The area codes are those of known challenge areas — the caller drops
    /// anything else the model returned. More than three questions are cut to three.
    /// </summary>
    public void Classify(
        IReadOnlyList<ChallengeArea> challengeAreas,
        IReadOnlyList<string> rootCauses,
        string? targetGroup,
        ProblemReportUrgency? urgency,
        IReadOnlyList<string> keywords,
        IReadOnlyList<string> clarifyingQuestions,
        DateTimeOffset classifiedAt)
    {
        ArgumentNullException.ThrowIfNull(challengeAreas);
        ArgumentNullException.ThrowIfNull(rootCauses);
        ArgumentNullException.ThrowIfNull(keywords);
        ArgumentNullException.ThrowIfNull(clarifyingQuestions);

        if (ClassifiedAt is not null)
        {
            throw new InvalidOperationException($"Problem report {Id} is already classified.");
        }

        ChallengeAreaCodes = [.. challengeAreas.Select(area => area.Code).Distinct()];
        RootCauses = [.. NonBlank(rootCauses)];
        TargetGroup = string.IsNullOrWhiteSpace(targetGroup) ? null : targetGroup.Trim();
        Urgency = urgency;
        Keywords = [.. NonBlank(keywords).Distinct(StringComparer.OrdinalIgnoreCase)];
        ClarifyingQuestions = [.. NonBlank(clarifyingQuestions).Take(MaxClarifyingQuestions).Select(ClarifyingQuestion.Ask)];
        ClassifiedAt = classifiedAt;
        QuestionsSettledAt = ClarifyingQuestions.Count == 0 ? classifiedAt : null;
        UpdatedAt = classifiedAt;
    }

    /// <summary>
    /// Answers the clarifying questions in their order; an empty list skips them all, and a blank answer skips one.
    /// Answers are anonymized like the description.
    /// </summary>
    public void AnswerQuestions(IReadOnlyList<string?> answers, DateTimeOffset answeredAt)
    {
        ArgumentNullException.ThrowIfNull(answers);

        if (!AwaitsAnswers)
        {
            throw new DomainException("This report does not wait for answers.", StatusCodes.Status409Conflict);
        }

        if (answers.Count > ClarifyingQuestions.Count)
        {
            throw new DomainException($"This report has {ClarifyingQuestions.Count} questions to answer.");
        }

        for (int index = 0; index < answers.Count; index++)
        {
            string? answer = answers[index]?.Trim();
            if (answer is not null && answer.Length > AnswerMaxLength)
            {
                throw new DomainException($"An answer has at most {AnswerMaxLength} characters.");
            }

            string? anonymized = string.IsNullOrEmpty(answer) ? null : Anonymizer.Anonymize(answer);
            ClarifyingQuestions[index].RecordAnswer(anonymized);
        }

        QuestionsSettledAt = answeredAt;
        UpdatedAt = answeredAt;
    }

    /// <summary>Marks the matches as stored: matching runs once per report, and the same input gives the stored result.</summary>
    public void RecordMatches(DateTimeOffset matchedAt)
    {
        if (!IsReadyForMatching)
        {
            throw new InvalidOperationException($"Problem report {Id} is not ready for matching.");
        }

        MatchedAt = matchedAt;
        UpdatedAt = matchedAt;
    }

    /// <summary>
    /// An administrator moves the report forward through its statuses, or closes it from any of them (SPEC 7 V). The
    /// order is the order of <see cref="ProblemReportStatus"/>.
    /// </summary>
    public void MoveByAdmin(ProblemReportStatus next, DateTimeOffset changedAt)
    {
        if (Status == ProblemReportStatus.CLOSED)
        {
            throw new DomainException("A closed report does not change any more.", StatusCodes.Status409Conflict);
        }

        if (next == Status)
        {
            throw new DomainException($"The report is already {Status}.", StatusCodes.Status409Conflict);
        }

        if (next != ProblemReportStatus.CLOSED && next < Status)
        {
            throw new DomainException("An administrator moves a report forward or closes it, never back.");
        }

        Status = next;
        UpdatedAt = changedAt;
    }

    /// <summary>The administrators' draft reply — generated by the assistant, then edited by hand.</summary>
    public void SaveReplyDraft(string? text, DateTimeOffset changedAt)
    {
        string trimmed = text?.Trim() ?? string.Empty;
        if (trimmed.Length == 0)
        {
            throw new DomainException("A reply draft cannot be empty.");
        }

        if (trimmed.Length > ReplyDraftMaxLength)
        {
            throw new DomainException($"A reply draft has at most {ReplyDraftMaxLength} characters.");
        }

        ReplyDraft = trimmed;
        ReplyDraftUpdatedAt = changedAt;
        UpdatedAt = changedAt;
    }

    /// <summary>A signed-in user takes an anonymous report into the account, once: after that it has an author.</summary>
    public void ClaimBy(Guid userId, DateTimeOffset claimedAt)
    {
        if (userId == Guid.Empty)
        {
            throw new InvalidOperationException("The user claiming a problem report has an empty id.");
        }

        if (AuthorId is not null)
        {
            throw new DomainException("This report already belongs to an account.", StatusCodes.Status409Conflict);
        }

        AuthorId = userId;
        ClaimedAt = claimedAt;
        UpdatedAt = claimedAt;
    }

    /// <summary>
    /// The author, an administrator or whoever holds the tracking code. Everyone else must not learn the report exists.
    /// </summary>
    public bool IsVisibleTo(Guid? userId, bool isAdmin, string? presentedTrackingCode)
    {
        if (isAdmin)
        {
            return true;
        }

        if (userId is not null && AuthorId == userId)
        {
            return true;
        }

        string? presented = Domain.TrackingCode.Normalize(presentedTrackingCode);
        return presented is not null && presented == TrackingCode;
    }

    /// <summary>The original description is personal: only its author and administrators see it.</summary>
    public bool ShowsOriginalTo(Guid? userId, bool isAdmin)
    {
        return isAdmin || (userId is not null && AuthorId == userId);
    }

    /// <summary>The anonymized description with the answered questions — the text matching works on.</summary>
    public string DescribeForMatching()
    {
        var text = new StringBuilder(Description);
        foreach (ClarifyingQuestion question in ClarifyingQuestions.Where(question => question.Answer is not null))
        {
            text.AppendLine();
            text.Append(question.Question).Append(' ').Append(question.Answer);
        }

        return text.ToString();
    }

    private static string EnsureDescription(string? description)
    {
        string trimmed = description?.Trim() ?? string.Empty;
        if (trimmed.Length < DescriptionMinLength)
        {
            throw new DomainException($"Describe the problem in at least {DescriptionMinLength} characters.");
        }

        if (trimmed.Length > DescriptionMaxLength)
        {
            throw new DomainException($"A problem description has at most {DescriptionMaxLength} characters.");
        }

        return trimmed;
    }

    private static ProblemReportChannel ChannelOf(bool submittedOnBehalf, bool dictated)
    {
        if (submittedOnBehalf)
        {
            return ProblemReportChannel.ASSISTED;
        }

        return dictated ? ProblemReportChannel.VOICE : ProblemReportChannel.TEXT;
    }

    private static IEnumerable<string> NonBlank(IEnumerable<string> texts)
    {
        return texts.Where(text => !string.IsNullOrWhiteSpace(text)).Select(text => text.Trim());
    }
}
