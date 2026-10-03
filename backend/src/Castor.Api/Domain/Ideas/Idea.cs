using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace Castor.Api.Domain;

/// <summary>
/// An idea card from the Kreator (SPEC 7 III), written with the Social Innovation Canvas. A draft is seen only by its
/// authors; once submitted, every signed-in user sees it, so the duplicate check has something to show. Experts of its
/// areas review it and an administrator accepts or rejects it.
/// </summary>
public sealed class Idea
{
    public const int TitleMaxLength = 200;

    public const int SolutionMaxLength = 4000;

    public const int OtherRecipientsMaxLength = 300;

    public const int ActorsMaxLength = 2000;

    public const int DifferenceNoteMaxLength = 2000;

    public const int MaxChallengeAreas = 3;

    /// <summary>A SHA-256 in hexadecimal.</summary>
    public const int FingerprintLength = 64;

    private Idea()
    {
    }

    public Guid Id { get; private set; }

    /// <summary>The user who started the idea.</summary>
    public Guid AuthorId { get; private set; }

    public List<IdeaCoAuthor> CoAuthors { get; private set; } = [];

    public IdeaStatus Status { get; private set; }

    public string Title { get; private set; } = null!;

    /// <summary>One to three areas, chosen by the author; their experts review the idea.</summary>
    public List<string> ChallengeAreaCodes { get; private set; } = [];

    /// <summary>1–4 on <see cref="CanvasOptions.Intensity"/>; null until chosen.</summary>
    public int? ProblemIntensity { get; private set; }

    /// <summary>1–4 on <see cref="CanvasOptions.Frequency"/>; null until chosen.</summary>
    public int? ProblemFrequency { get; private set; }

    /// <summary>1–4 on <see cref="CanvasOptions.Scale"/>; null until chosen.</summary>
    public int? ProblemScale { get; private set; }

    /// <summary>Codes of <see cref="CanvasOptions.Recipients"/>.</summary>
    public List<string> Recipients { get; private set; } = [];

    /// <summary>Recipients the Canvas list does not name, in the author's words.</summary>
    public string? OtherRecipients { get; private set; }

    /// <summary>The essence of the solution.</summary>
    public string? Solution { get; private set; }

    public InnovationStage Stage { get; private set; }

    /// <summary>Actors of change who support it.</summary>
    public string? Supporters { get; private set; }

    /// <summary>Actors of change who may hinder it.</summary>
    public string? Opponents { get; private set; }

    /// <summary>Codes of <see cref="CanvasOptions.EmotionalValues"/>, at most three.</summary>
    public List<string> EmotionalValues { get; private set; } = [];

    /// <summary>Codes of <see cref="CanvasOptions.FunctionalValues"/>, at most three.</summary>
    public List<string> FunctionalValues { get; private set; } = [];

    /// <summary>Why the idea differs from the similar cards the duplicate check found.</summary>
    public string? DifferenceNote { get; private set; }

    /// <summary>The innovations of the hybrid the idea was started from ("Rozwiń w Kreatorze").</summary>
    public List<Guid> FromHybridOf { get; private set; } = [];

    /// <summary>A similar innovation the author took as the starting point.</summary>
    public Guid? StartingInnovationId { get; private set; }

    /// <summary>The last duplicate check; see <see cref="HasCurrentSimilarity"/>.</summary>
    public List<IdeaSimilarity> Similar { get; private set; } = [];

    public DateTimeOffset? SimilarCheckedAt { get; private set; }

    /// <summary>The <see cref="Fingerprint"/> of the card the last check read.</summary>
    public string? SimilarFingerprint { get; private set; }

    public DateTimeOffset? SubmittedAt { get; private set; }

    public DateTimeOffset? DecidedAt { get; private set; }

    /// <summary>The idea looks for people to try it (Poletko). Only IDEA and PROTOTYPE stages allow it.</summary>
    public bool SeeksTesters { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    /// <param name="challengeAreas">The areas of the card, already found by the handler.</param>
    public static Idea Draft(
        Guid authorId,
        IdeaCanvas canvas,
        IReadOnlyList<ChallengeArea> challengeAreas,
        Innovation? startingInnovation,
        DateTimeOffset createdAt)
    {
        if (authorId == Guid.Empty)
        {
            throw new InvalidOperationException("The author of a new idea has an empty id.");
        }

        var idea = new Idea
        {
            Id = Guid.CreateVersion7(),
            AuthorId = authorId,
            Status = IdeaStatus.DRAFT,
            CreatedAt = createdAt,
        };

        idea.Write(canvas, challengeAreas, startingInnovation, createdAt);
        return idea;
    }

    /// <summary>"Rozwiń w Kreatorze": a draft filled in from a hybrid, with its source innovations.</summary>
    /// <param name="challengeAreas">The areas of the report the hybrid was proposed for.</param>
    public static Idea FromHybrid(Guid authorId, MatchResult hybrid, IReadOnlyList<ChallengeArea> challengeAreas, DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(hybrid);
        ArgumentNullException.ThrowIfNull(challengeAreas);

        if (hybrid.Kind != MatchKind.HYBRID || hybrid.HybridName is null || hybrid.HybridDescription is null)
        {
            throw new InvalidOperationException($"Match result {hybrid.Id} is not a hybrid.");
        }

        string title = Shorten(hybrid.HybridName, TitleMaxLength);
        string solution = Shorten($"{hybrid.HybridDescription}\n\nDlaczego razem: {hybrid.Justification}", SolutionMaxLength);
        List<ChallengeArea> areas = [.. challengeAreas.Take(MaxChallengeAreas)];
        var canvas = new IdeaCanvas(title, null, null, null, [], null, solution, InnovationStage.IDEA, null, null, [], [], null);

        Idea idea = Draft(authorId, canvas, areas, null, createdAt);
        idea.FromHybridOf = [.. hybrid.SourceInnovationIds];
        return idea;
    }

    public bool IsAuthoredBy(Guid? userId)
    {
        return userId is not null && (AuthorId == userId || CoAuthors.Any(coAuthor => coAuthor.UserId == userId));
    }

    /// <summary>A draft only to its authors and administrators; a submitted idea to every signed-in user.</summary>
    public bool IsVisibleTo(Guid userId, bool isAdmin)
    {
        return isAdmin || Status != IdeaStatus.DRAFT || IsAuthoredBy(userId);
    }

    /// <summary>The authors edit until an administrator decides — also after submitting, e.g. after an expert's "popraw".</summary>
    public bool IsEditableBy(Guid userId)
    {
        return IsAuthoredBy(userId) && Status is IdeaStatus.DRAFT or IdeaStatus.SUBMITTED;
    }

    /// <summary>An expert of one of the idea's areas; a submitted idea is also visible to everyone else.</summary>
    /// <param name="expertAreaCodes">The reader's areas as an expert; empty for anyone else.</param>
    public bool IsInAreasOf(IReadOnlyCollection<string> expertAreaCodes)
    {
        ArgumentNullException.ThrowIfNull(expertAreaCodes);

        return expertAreaCodes.Any(ChallengeAreaCodes.Contains);
    }

    /// <summary>An expert reviews a submitted idea of their areas while it waits for a decision.</summary>
    /// <param name="expertAreaCodes">The reader's areas as an expert; empty for anyone else.</param>
    public bool IsReviewableBy(IReadOnlyCollection<string> expertAreaCodes)
    {
        return Status == IdeaStatus.SUBMITTED && IsInAreasOf(expertAreaCodes);
    }

    public bool AcceptsCoAuthor(Guid userId)
    {
        return (Status is IdeaStatus.SUBMITTED or IdeaStatus.ACCEPTED) && !IsAuthoredBy(userId);
    }

    public void Revise(
        Guid editorId,
        IdeaCanvas canvas,
        IReadOnlyList<ChallengeArea> challengeAreas,
        Innovation? startingInnovation,
        DateTimeOffset changedAt)
    {
        if (!IsAuthoredBy(editorId))
        {
            throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);
        }

        if (Status is not (IdeaStatus.DRAFT or IdeaStatus.SUBMITTED))
        {
            throw new DomainException("The idea has been decided on and is not edited any more.", StatusCodes.Status409Conflict);
        }

        Write(canvas, challengeAreas, startingInnovation, changedAt);

        // A submitted card keeps what submitting required; the handler does not save after the exception.
        List<string> missing = Status == IdeaStatus.SUBMITTED ? MissingForSubmission() : [];
        if (missing.Count > 0)
        {
            throw new DomainException($"A submitted idea keeps: {string.Join(", ", missing)}.");
        }
    }

    /// <summary>Sends the draft to ROPS and its experts; the card has to say what, for whom and why first.</summary>
    public void Submit(Guid submitterId, DateTimeOffset submittedAt)
    {
        if (!IsAuthoredBy(submitterId))
        {
            throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);
        }

        if (Status != IdeaStatus.DRAFT)
        {
            throw new DomainException("The idea has already been submitted.", StatusCodes.Status409Conflict);
        }

        List<string> missing = MissingForSubmission();
        if (missing.Count > 0)
        {
            throw new DomainException($"Fill in before submitting: {string.Join(", ", missing)}.");
        }

        Status = IdeaStatus.SUBMITTED;
        SubmittedAt = submittedAt;
        UpdatedAt = submittedAt;
    }

    /// <summary>"Dołącz do istniejącego pomysłu": the user becomes a co-author instead of submitting a similar idea.</summary>
    public IdeaCoAuthor Join(Guid userId, DateTimeOffset joinedAt)
    {
        if (IsAuthoredBy(userId))
        {
            throw new DomainException("You are already an author of this idea.", StatusCodes.Status409Conflict);
        }

        if (!AcceptsCoAuthor(userId))
        {
            throw new DomainException("Only a submitted or accepted idea takes co-authors.", StatusCodes.Status409Conflict);
        }

        IdeaCoAuthor coAuthor = IdeaCoAuthor.Join(this, userId, joinedAt);
        CoAuthors.Add(coAuthor);
        UpdatedAt = joinedAt;
        return coAuthor;
    }

    /// <summary>An administrator accepts or rejects a submitted idea.</summary>
    public void Decide(IdeaStatus decision, DateTimeOffset decidedAt)
    {
        if (decision is not (IdeaStatus.ACCEPTED or IdeaStatus.REJECTED))
        {
            throw new DomainException("The decision is ACCEPTED or REJECTED.");
        }

        if (Status != IdeaStatus.SUBMITTED)
        {
            throw new DomainException("Only a submitted idea is decided on.", StatusCodes.Status409Conflict);
        }

        Status = decision;
        DecidedAt = decidedAt;
        if (decision == IdeaStatus.REJECTED)
        {
            SeeksTesters = false;
        }

        UpdatedAt = decidedAt;
    }

    /// <summary>Authors or ROPS turn "szukam testerów" on for an early-stage idea that is not a draft or rejected.</summary>
    public void SetSeeksTesters(Guid editorId, bool seeksTesters, DateTimeOffset changedAt, bool asAdmin = false)
    {
        if (!asAdmin && !IsAuthoredBy(editorId))
        {
            throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);
        }

        if (Status is IdeaStatus.DRAFT or IdeaStatus.REJECTED)
        {
            throw new DomainException("Only a submitted or accepted idea looks for testers.", StatusCodes.Status409Conflict);
        }

        if (seeksTesters && Stage is not (InnovationStage.IDEA or InnovationStage.PROTOTYPE))
        {
            throw new DomainException("Only an idea or a prototype can look for testers.");
        }

        SeeksTesters = seeksTesters;
        UpdatedAt = changedAt;
    }

    public void RecordSimilarity(IReadOnlyList<IdeaSimilarity> similar, DateTimeOffset checkedAt)
    {
        ArgumentNullException.ThrowIfNull(similar);

        Similar = [.. similar];
        SimilarCheckedAt = checkedAt;
        SimilarFingerprint = Fingerprint();
    }

    /// <summary>Whether the last duplicate check read the card as it is now.</summary>
    public bool HasCurrentSimilarity()
    {
        return SimilarFingerprint is not null && SimilarFingerprint == Fingerprint();
    }

    /// <summary>The card as text for the language model, with the Canvas words instead of codes. Not anonymized.</summary>
    public string DescribeForMatching()
    {
        var text = new StringBuilder();
        text.AppendLine(Title);
        AppendLine(text, "Rozwiązanie", Solution);
        AppendLine(text, "Problem", DescribeProblem());
        AppendLine(text, "Odbiorcy", DescribeRecipients());
        AppendLine(text, "Etap", CanvasOptions.LabelOf(CanvasOptions.Stages, Stage.ToString()));
        AppendLine(text, "Wspierają zmianę", Supporters);
        AppendLine(text, "Utrudniają zmianę", Opponents);
        AppendLine(text, "Wartości emocjonalne", LabelsOf(CanvasOptions.EmotionalValues, EmotionalValues));
        AppendLine(text, "Wartości funkcjonalne", LabelsOf(CanvasOptions.FunctionalValues, FunctionalValues));
        AppendLine(text, "Czym różni się od podobnych", DifferenceNote);
        return text.ToString().Trim();
    }

    /// <summary>The three problem scales in the Canvas words, or null while none is chosen.</summary>
    public string? DescribeProblem()
    {
        var parts = new List<string>();
        if (ProblemIntensity is int intensity)
        {
            parts.Add($"intensywność — {CanvasOptions.LabelOf(CanvasOptions.Intensity, intensity)}");
        }

        if (ProblemFrequency is int frequency)
        {
            parts.Add($"częstotliwość — {CanvasOptions.LabelOf(CanvasOptions.Frequency, frequency)}");
        }

        if (ProblemScale is int scale)
        {
            parts.Add($"skala — {CanvasOptions.LabelOf(CanvasOptions.Scale, scale)}");
        }

        return parts.Count == 0 ? null : string.Join("; ", parts);
    }

    /// <summary>The recipients in the Canvas words with the author's own, or null while there are none.</summary>
    public string? DescribeRecipients()
    {
        List<string> recipients = [.. Recipients.Select(code => CanvasOptions.LabelOf(CanvasOptions.Recipients, code))];
        if (OtherRecipients is not null)
        {
            recipients.Add(OtherRecipients);
        }

        return recipients.Count == 0 ? null : string.Join(", ", recipients);
    }

    /// <summary>The card text and its areas, hashed: what the duplicate check depends on.</summary>
    public string Fingerprint()
    {
        string description = DescribeForMatching();
        string areas = string.Join(",", ChallengeAreaCodes.Order(StringComparer.Ordinal));
        byte[] bytes = Encoding.UTF8.GetBytes($"{description}\n{areas}");
        byte[] hash = SHA256.HashData(bytes);
        return Convert.ToHexStringLower(hash);
    }

    /// <summary>The fields the card still lacks before submitting, named as in the API request.</summary>
    public List<string> MissingForSubmission()
    {
        var missing = new List<string>();
        if (ChallengeAreaCodes.Count == 0)
        {
            missing.Add("challengeAreaCodes");
        }

        if (ProblemIntensity is null)
        {
            missing.Add("problemIntensity");
        }

        if (ProblemFrequency is null)
        {
            missing.Add("problemFrequency");
        }

        if (ProblemScale is null)
        {
            missing.Add("problemScale");
        }

        if (Recipients.Count == 0 && OtherRecipients is null)
        {
            missing.Add("recipients");
        }

        if (Solution is null)
        {
            missing.Add("solution");
        }

        return missing;
    }

    private static void AppendLine(StringBuilder text, string label, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
        {
            text.Append(CultureInfo.InvariantCulture, $"{label}: {value}").AppendLine();
        }
    }

    private static string? LabelsOf(IReadOnlyList<CanvasOption> options, List<string> codes)
    {
        return codes.Count == 0 ? null : string.Join(", ", codes.Select(code => CanvasOptions.LabelOf(options, code)));
    }

    private static string Shorten(string text, int maxLength)
    {
        string trimmed = text.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..(maxLength - 1)] + "…";
    }

    private static string? Optional(string? text, int maxLength, string field)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        string trimmed = text.Trim();
        if (trimmed.Length > maxLength)
        {
            throw new DomainException($"{field} has at most {maxLength} characters.");
        }

        return trimmed;
    }

    private static int? ScaleStep(int? level)
    {
        if (level is int step && step is < CanvasOptions.ScaleMin or > CanvasOptions.ScaleMax)
        {
            throw new DomainException($"A problem scale is a step from {CanvasOptions.ScaleMin} to {CanvasOptions.ScaleMax}.");
        }

        return level;
    }

    private static List<string> Choices(IReadOnlyList<string> codes, IReadOnlyList<CanvasOption> options, int? max, string field)
    {
        ArgumentNullException.ThrowIfNull(codes);

        List<string> distinct = [.. codes.Distinct(StringComparer.Ordinal)];
        if (distinct.Any(code => options.All(option => option.Code != code)))
        {
            throw new DomainException($"Choose {field} from the Canvas list.");
        }

        if (max is int limit && distinct.Count > limit)
        {
            throw new DomainException($"Choose at most {limit} {field}.");
        }

        return distinct;
    }

    private void Write(IdeaCanvas canvas, IReadOnlyList<ChallengeArea> challengeAreas, Innovation? startingInnovation, DateTimeOffset changedAt)
    {
        ArgumentNullException.ThrowIfNull(canvas);
        ArgumentNullException.ThrowIfNull(challengeAreas);

        if (string.IsNullOrWhiteSpace(canvas.Title))
        {
            throw new DomainException("An idea needs a title.");
        }

        string title = canvas.Title.Trim();
        if (title.Length > TitleMaxLength)
        {
            throw new DomainException($"An idea title has at most {TitleMaxLength} characters.");
        }

        List<string> areaCodes = [.. challengeAreas.Select(area => area.Code).Distinct(StringComparer.Ordinal)];
        if (areaCodes.Count > MaxChallengeAreas)
        {
            throw new DomainException($"An idea has at most {MaxChallengeAreas} challenge areas.");
        }

        Title = title;
        ChallengeAreaCodes = areaCodes;
        ProblemIntensity = ScaleStep(canvas.ProblemIntensity);
        ProblemFrequency = ScaleStep(canvas.ProblemFrequency);
        ProblemScale = ScaleStep(canvas.ProblemScale);
        Recipients = Choices(canvas.Recipients, CanvasOptions.Recipients, max: null, "recipients");
        OtherRecipients = Optional(canvas.OtherRecipients, OtherRecipientsMaxLength, "Other recipients");
        Solution = Optional(canvas.Solution, SolutionMaxLength, "The essence of the solution");
        Stage = canvas.Stage;
        if (Stage is not (InnovationStage.IDEA or InnovationStage.PROTOTYPE))
        {
            SeeksTesters = false;
        }

        Supporters = Optional(canvas.Supporters, ActorsMaxLength, "Supporters");
        Opponents = Optional(canvas.Opponents, ActorsMaxLength, "Opponents");
        EmotionalValues = Choices(canvas.EmotionalValues, CanvasOptions.EmotionalValues, CanvasOptions.MaxValues, "emotional values");
        FunctionalValues = Choices(canvas.FunctionalValues, CanvasOptions.FunctionalValues, CanvasOptions.MaxValues, "functional values");
        DifferenceNote = Optional(canvas.DifferenceNote, DifferenceNoteMaxLength, "The difference note");
        StartingInnovationId = startingInnovation?.Id;
        UpdatedAt = changedAt;
    }
}
