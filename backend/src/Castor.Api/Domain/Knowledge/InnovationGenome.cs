namespace Castor.Api.Domain;

/// <summary>
/// The structured description of an innovation that matching works on: root causes, mechanisms, target groups,
/// required resources, scale and challenge areas. Generated once by the language model as a draft; an administrator
/// approves or corrects it (module VI). Until then matching uses the draft — an approved genome only replaces it.
/// </summary>
public sealed class InnovationGenome
{
    public const int SummaryMaxLength = 600;

    private InnovationGenome()
    {
    }

    public Guid Id { get; private set; }

    public Guid InnovationId { get; private set; }

    public List<string> RootCauses { get; private set; } = [];

    public List<string> Mechanisms { get; private set; } = [];

    public List<string> TargetGroups { get; private set; } = [];

    public RequiredResources RequiredResources { get; private set; } = null!;

    /// <summary>The scale the innovation works at, in words, e.g. "one neighbourhood" or "a whole gmina".</summary>
    public string? Scale { get; private set; }

    public List<string> ChallengeAreaCodes { get; private set; } = [];

    public string Summary { get; private set; } = null!;

    public InnovationGenomeStatus Status { get; private set; }

    public Guid? ApprovedByUserId { get; private set; }

    public DateTimeOffset? ApprovedAt { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    /// <summary>
    /// A draft genome for an innovation that has none. The area codes are those of known challenge areas — the
    /// caller drops anything else the model returned.
    /// </summary>
    public static InnovationGenome Draft(
        Innovation innovation,
        IReadOnlyList<string> rootCauses,
        IReadOnlyList<string> mechanisms,
        IReadOnlyList<string> targetGroups,
        RequiredResources requiredResources,
        string? scale,
        IReadOnlyList<ChallengeArea> challengeAreas,
        string summary,
        DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(innovation);
        ArgumentNullException.ThrowIfNull(rootCauses);
        ArgumentNullException.ThrowIfNull(mechanisms);
        ArgumentNullException.ThrowIfNull(targetGroups);
        ArgumentNullException.ThrowIfNull(requiredResources);
        ArgumentNullException.ThrowIfNull(challengeAreas);

        if (innovation.Genome is not null)
        {
            throw new InvalidOperationException($"Innovation {innovation.Id} already has a genome.");
        }

        string trimmedSummary = EnsureSummary(summary);

        return new InnovationGenome
        {
            Id = Guid.CreateVersion7(),
            InnovationId = innovation.Id,
            RootCauses = [.. rootCauses],
            Mechanisms = [.. mechanisms],
            TargetGroups = [.. targetGroups],
            RequiredResources = requiredResources,
            Scale = string.IsNullOrWhiteSpace(scale) ? null : scale.Trim(),
            ChallengeAreaCodes = [.. challengeAreas.Select(area => area.Code).Distinct()],
            Summary = trimmedSummary,
            Status = InnovationGenomeStatus.DRAFT,
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
        };
    }

    /// <summary>An administrator corrects the genome; the corrected genome is approved at once.</summary>
    public void Revise(
        IReadOnlyList<string> rootCauses,
        IReadOnlyList<string> mechanisms,
        IReadOnlyList<string> targetGroups,
        RequiredResources requiredResources,
        string? scale,
        IReadOnlyList<ChallengeArea> challengeAreas,
        string? summary,
        Guid approvedByUserId,
        DateTimeOffset changedAt)
    {
        ArgumentNullException.ThrowIfNull(rootCauses);
        ArgumentNullException.ThrowIfNull(mechanisms);
        ArgumentNullException.ThrowIfNull(targetGroups);
        ArgumentNullException.ThrowIfNull(requiredResources);
        ArgumentNullException.ThrowIfNull(challengeAreas);

        string trimmedSummary = EnsureSummary(summary);
        RootCauses = [.. NonBlank(rootCauses)];
        Mechanisms = [.. NonBlank(mechanisms)];
        TargetGroups = [.. NonBlank(targetGroups)];
        RequiredResources = requiredResources;
        Scale = string.IsNullOrWhiteSpace(scale) ? null : scale.Trim();
        ChallengeAreaCodes = [.. challengeAreas.Select(area => area.Code).Distinct()];
        Summary = trimmedSummary;
        Approve(approvedByUserId, changedAt);
    }

    /// <summary>An administrator confirms the genome as it is; matching keeps using it either way.</summary>
    public void Approve(Guid approvedByUserId, DateTimeOffset approvedAt)
    {
        if (approvedByUserId == Guid.Empty)
        {
            throw new InvalidOperationException("The administrator approving a genome has an empty id.");
        }

        Status = InnovationGenomeStatus.APPROVED;
        ApprovedByUserId = approvedByUserId;
        ApprovedAt = approvedAt;
        UpdatedAt = approvedAt;
    }

    private static string EnsureSummary(string? summary)
    {
        if (string.IsNullOrWhiteSpace(summary))
        {
            throw new DomainException("A genome needs a summary.");
        }

        string trimmed = summary.Trim();
        if (trimmed.Length > SummaryMaxLength)
        {
            throw new DomainException($"A genome summary has at most {SummaryMaxLength} characters.");
        }

        return trimmed;
    }

    private static IEnumerable<string> NonBlank(IEnumerable<string> items)
    {
        return items.Where(item => !string.IsNullOrWhiteSpace(item)).Select(item => item.Trim());
    }
}
