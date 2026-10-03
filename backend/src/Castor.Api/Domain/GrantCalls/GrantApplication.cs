namespace Castor.Api.Domain;

/// <summary>
/// An application of an idea for an open grant call (SPEC 7 III): a summary and an answer to each criterion of the
/// call, drafted by the language model and edited by the idea's authors. One per idea and call; ROPS reads them all.
/// </summary>
public sealed class GrantApplication
{
    public const int TitleMaxLength = 300;

    public const int SummaryMaxLength = 4000;

    private GrantApplication()
    {
    }

    public Guid Id { get; private set; }

    public Guid IdeaId { get; private set; }

    public Guid GrantCallId { get; private set; }

    /// <summary>The author who generated it.</summary>
    public Guid CreatedByUserId { get; private set; }

    public string Title { get; private set; } = null!;

    public string? Summary { get; private set; }

    /// <summary>The criteria of the call, in its order, with the answers.</summary>
    public List<GrantApplicationAnswer> Answers { get; private set; } = [];

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    /// <param name="answers">One answer per criterion of the call, in its order; null for one the draft left open.</param>
    public static GrantApplication Draft(
        Idea idea,
        GrantCall grantCall,
        Guid authorId,
        string? title,
        string? summary,
        IReadOnlyList<string?> answers,
        DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(idea);
        ArgumentNullException.ThrowIfNull(grantCall);
        ArgumentNullException.ThrowIfNull(answers);

        if (!idea.IsAuthoredBy(authorId))
        {
            throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);
        }

        if (idea.Status == IdeaStatus.REJECTED)
        {
            throw new DomainException("A rejected idea is not applied with.", StatusCodes.Status409Conflict);
        }

        if (!grantCall.IsOpen)
        {
            throw new DomainException("The grant call is not open.", StatusCodes.Status409Conflict);
        }

        if (answers.Count != grantCall.Criteria.Count)
        {
            throw new InvalidOperationException($"Grant call {grantCall.Id} has {grantCall.Criteria.Count} criteria, not {answers.Count}.");
        }

        var application = new GrantApplication
        {
            Id = Guid.CreateVersion7(),
            IdeaId = idea.Id,
            GrantCallId = grantCall.Id,
            CreatedByUserId = authorId,
            Answers = [.. grantCall.Criteria.Select((criterion, index) => GrantApplicationAnswer.To(criterion, answers[index]))],
            CreatedAt = createdAt,
        };

        application.Write(title, summary, createdAt);
        return application;
    }

    /// <summary>The authors rewrite it; the criteria stay as they were when the application was generated.</summary>
    /// <param name="answers">One answer per criterion of the application, in its order.</param>
    public void Revise(Idea idea, Guid editorId, string? title, string? summary, IReadOnlyList<string?> answers, DateTimeOffset changedAt)
    {
        ArgumentNullException.ThrowIfNull(idea);
        ArgumentNullException.ThrowIfNull(answers);

        if (idea.Id != IdeaId)
        {
            throw new InvalidOperationException($"Application {Id} belongs to another idea.");
        }

        if (!idea.IsAuthoredBy(editorId))
        {
            throw new DomainException("The application does not exist.", StatusCodes.Status404NotFound);
        }

        if (answers.Count != Answers.Count)
        {
            throw new DomainException($"The application answers {Answers.Count} criteria.");
        }

        List<GrantApplicationAnswer> revised = [.. Answers.Select((answer, index) => GrantApplicationAnswer.To(answer.Criterion, answers[index]))];
        Write(title, summary, changedAt);
        Answers = revised;
    }

    private void Write(string? title, string? summary, DateTimeOffset changedAt)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new DomainException("An application needs a title.");
        }

        string trimmedTitle = title.Trim();
        if (trimmedTitle.Length > TitleMaxLength)
        {
            throw new DomainException($"An application title has at most {TitleMaxLength} characters.");
        }

        string? trimmedSummary = string.IsNullOrWhiteSpace(summary) ? null : summary.Trim();
        if (trimmedSummary?.Length > SummaryMaxLength)
        {
            throw new DomainException($"An application summary has at most {SummaryMaxLength} characters.");
        }

        Title = trimmedTitle;
        Summary = trimmedSummary;
        UpdatedAt = changedAt;
    }
}
