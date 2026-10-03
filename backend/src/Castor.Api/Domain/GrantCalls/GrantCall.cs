namespace Castor.Api.Domain;

/// <summary>
/// A grant competition with dates and criteria. Administrators prepare, open and close it (module VI); while it is open,
/// the Kreator turns ideas into applications for it (module III).
/// </summary>
public sealed class GrantCall
{
    public const int TitleMaxLength = 300;

    public const int DescriptionMaxLength = 4000;

    private GrantCall()
    {
    }

    public Guid Id { get; private set; }

    public string Title { get; private set; } = null!;

    public string? Description { get; private set; }

    public List<string> Criteria { get; private set; } = [];

    public List<string> ChallengeAreaCodes { get; private set; } = [];

    public DateOnly? OpensOn { get; private set; }

    public DateOnly? ClosesOn { get; private set; }

    public GrantCallStatus Status { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public bool IsOpen => Status == GrantCallStatus.OPEN;

    public static GrantCall Draft(
        string? title,
        string? description,
        IReadOnlyList<string> criteria,
        IReadOnlyList<ChallengeArea> challengeAreas,
        DateOnly? opensOn,
        DateOnly? closesOn,
        DateTimeOffset createdAt)
    {
        var grantCall = new GrantCall
        {
            Id = Guid.CreateVersion7(),
            Status = GrantCallStatus.DRAFT,
            CreatedAt = createdAt,
        };

        grantCall.Revise(title, description, criteria, challengeAreas, opensOn, closesOn, createdAt);
        return grantCall;
    }

    /// <summary>The whole content at once: the dates depend on each other.</summary>
    public void Revise(
        string? title,
        string? description,
        IReadOnlyList<string> criteria,
        IReadOnlyList<ChallengeArea> challengeAreas,
        DateOnly? opensOn,
        DateOnly? closesOn,
        DateTimeOffset changedAt)
    {
        ArgumentNullException.ThrowIfNull(criteria);
        ArgumentNullException.ThrowIfNull(challengeAreas);

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new DomainException("A grant call needs a title.");
        }

        string trimmedTitle = title.Trim();
        if (trimmedTitle.Length > TitleMaxLength)
        {
            throw new DomainException($"A grant call title has at most {TitleMaxLength} characters.");
        }

        string? trimmedDescription = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        if (trimmedDescription?.Length > DescriptionMaxLength)
        {
            throw new DomainException($"A grant call description has at most {DescriptionMaxLength} characters.");
        }

        if (opensOn is DateOnly opens && closesOn is DateOnly closes && closes < opens)
        {
            throw new DomainException("A grant call closes after it opens.");
        }

        Title = trimmedTitle;
        Description = trimmedDescription;
        Criteria = [.. criteria.Where(criterion => !string.IsNullOrWhiteSpace(criterion)).Select(criterion => criterion.Trim())];
        ChallengeAreaCodes = [.. challengeAreas.Select(area => area.Code).Distinct()];
        OpensOn = opensOn;
        ClosesOn = closesOn;
        UpdatedAt = changedAt;
    }

    public void Open(DateTimeOffset changedAt)
    {
        if (Status == GrantCallStatus.OPEN)
        {
            throw new DomainException("The grant call is already open.", StatusCodes.Status409Conflict);
        }

        if (Criteria.Count == 0)
        {
            throw new DomainException("Add the criteria before opening the grant call: applications are written against them.");
        }

        Status = GrantCallStatus.OPEN;
        UpdatedAt = changedAt;
    }

    public void Close(DateTimeOffset changedAt)
    {
        if (Status != GrantCallStatus.OPEN)
        {
            throw new DomainException("Only an open grant call can be closed.", StatusCodes.Status409Conflict);
        }

        Status = GrantCallStatus.CLOSED;
        UpdatedAt = changedAt;
    }
}
