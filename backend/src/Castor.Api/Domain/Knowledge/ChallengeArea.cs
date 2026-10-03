namespace Castor.Api.Domain;

/// <summary>
/// One of the eight areas of the Social Challenges Map. Its data are national, not regional. Reference data from the
/// seed: the code is the key other records point at.
/// </summary>
public sealed class ChallengeArea
{
    public const int CodeMaxLength = 50;

    public const int PlainTextMaxLength = 4000;

    private ChallengeArea()
    {
    }

    public Guid Id { get; private set; }

    /// <summary>A stable UPPER_SNAKE_CASE code, e.g. <c>SENIORS</c>.</summary>
    public string Code { get; private set; } = null!;

    /// <summary>The number of the area in the map, used for ordering.</summary>
    public int Number { get; private set; }

    public string Name { get; private set; } = null!;

    public string Definition { get; private set; } = null!;

    public List<string> KeyChallenges { get; private set; } = [];

    /// <summary>Where the description comes from; the UI shows it next to the data ("dane krajowe").</summary>
    public string Source { get; private set; } = null!;

    /// <summary>The definition rewritten in plain language. Visitors see it only after an administrator approves it.</summary>
    public string? PlainText { get; private set; }

    public PlainTextStatus? PlainTextStatus { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public static ChallengeArea Import(
        string code,
        int number,
        string name,
        string definition,
        IReadOnlyList<string> keyChallenges,
        string source,
        DateTimeOffset importedAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(code);
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(definition);
        ArgumentException.ThrowIfNullOrWhiteSpace(source);
        ArgumentNullException.ThrowIfNull(keyChallenges);

        return new ChallengeArea
        {
            Id = Guid.CreateVersion7(),
            Code = code,
            Number = number,
            Name = name,
            Definition = definition,
            KeyChallenges = [.. keyChallenges],
            Source = source,
            CreatedAt = importedAt,
        };
    }

    public void RecordPlainText(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new DomainException("The plain-language text is empty.");
        }

        string trimmed = text.Trim();
        if (trimmed.Length > PlainTextMaxLength)
        {
            throw new DomainException($"The plain-language text has at most {PlainTextMaxLength} characters.");
        }

        PlainText = trimmed;
        PlainTextStatus = Domain.PlainTextStatus.DRAFT;
    }

    public void ApprovePlainText()
    {
        if (PlainText is null)
        {
            throw new DomainException("There is no plain-language text to approve.", StatusCodes.Status409Conflict);
        }

        PlainTextStatus = Domain.PlainTextStatus.APPROVED;
    }
}
