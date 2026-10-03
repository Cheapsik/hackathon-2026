namespace Castor.Api.Domain;

/// <summary>A question the platform asks when a report is too general, and the answer, once given.</summary>
public sealed class ClarifyingQuestion
{
    private ClarifyingQuestion()
    {
    }

    public string Question { get; private set; } = null!;

    /// <summary>Anonymized like the description; null when the question was skipped.</summary>
    public string? Answer { get; private set; }

    public static ClarifyingQuestion Ask(string question)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(question);

        return new ClarifyingQuestion { Question = question.Trim() };
    }

    public void RecordAnswer(string? anonymizedAnswer)
    {
        Answer = string.IsNullOrWhiteSpace(anonymizedAnswer) ? null : anonymizedAnswer;
    }
}
