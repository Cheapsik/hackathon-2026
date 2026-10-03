namespace Castor.Api.Domain;

/// <summary>One criterion of the grant call, as it was when the application was written, and the idea's answer to it.</summary>
public sealed class GrantApplicationAnswer
{
    public const int AnswerMaxLength = 4000;

    private GrantApplicationAnswer()
    {
    }

    public string Criterion { get; private set; } = null!;

    /// <summary>Null while nobody has answered the criterion.</summary>
    public string? Answer { get; private set; }

    public static GrantApplicationAnswer To(string criterion, string? answer)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(criterion);

        string? trimmed = string.IsNullOrWhiteSpace(answer) ? null : answer.Trim();
        if (trimmed?.Length > AnswerMaxLength)
        {
            throw new DomainException($"An answer to a criterion has at most {AnswerMaxLength} characters.");
        }

        return new GrantApplicationAnswer
        {
            Criterion = criterion,
            Answer = trimmed,
        };
    }
}
