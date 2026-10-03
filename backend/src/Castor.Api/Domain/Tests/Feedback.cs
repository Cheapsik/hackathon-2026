namespace Castor.Api.Domain;

/// <summary>
/// A signed-in user's rating of an innovation: stars and what works / what to improve (SPEC 7 IV). Voice dictation is
/// stored as text; the form may mark it as dictated.
/// </summary>
public sealed class Feedback
{
    public const int StarsMin = 1;

    public const int StarsMax = 5;

    public const int CommentMaxLength = 4000;

    private Feedback()
    {
    }

    public Guid Id { get; private set; }

    public Guid InnovationId { get; private set; }

    public Guid AuthorId { get; private set; }

    public int Stars { get; private set; }

    public string? WhatWorks { get; private set; }

    public string? WhatToImprove { get; private set; }

    public bool Dictated { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public static Feedback Write(
        Innovation innovation,
        User author,
        int stars,
        string? whatWorks,
        string? whatToImprove,
        bool dictated,
        DateTimeOffset writtenAt)
    {
        ArgumentNullException.ThrowIfNull(innovation);
        ArgumentNullException.ThrowIfNull(author);

        var feedback = new Feedback
        {
            Id = Guid.CreateVersion7(),
            InnovationId = innovation.Id,
            AuthorId = author.Id,
            CreatedAt = writtenAt,
        };
        feedback.Revise(stars, whatWorks, whatToImprove, dictated, writtenAt);
        return feedback;
    }

    public void Revise(int stars, string? whatWorks, string? whatToImprove, bool dictated, DateTimeOffset changedAt)
    {
        if (stars is < StarsMin or > StarsMax)
        {
            throw new DomainException($"A rating is from {StarsMin} to {StarsMax} stars.");
        }

        string? works = Cut(whatWorks);
        string? improve = Cut(whatToImprove);
        if (works is null && improve is null)
        {
            throw new DomainException("Write what works or what to improve.");
        }

        Stars = stars;
        WhatWorks = works;
        WhatToImprove = improve;
        Dictated = dictated;
        UpdatedAt = changedAt;
    }

    private static string? Cut(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        string trimmed = text.Trim();
        if (trimmed.Length > CommentMaxLength)
        {
            throw new DomainException($"A comment has at most {CommentMaxLength} characters.");
        }

        return trimmed;
    }
}
