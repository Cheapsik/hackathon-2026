namespace Castor.Api.Domain;

/// <summary>
/// "Karta dopasowania do gminy": whether an innovation will take root in one gmina, from Obserwator data. Stored for
/// the pair (innovation, gmina) and the year of the data, and shown again instead of asking the model twice; an
/// administrator can recalculate it. Anyone may read a generated card (SPEC 6.5).
/// </summary>
public sealed class FitAssessment
{
    public const int MaxListItems = 10;

    private FitAssessment()
    {
    }

    public Guid Id { get; private set; }

    public Guid InnovationId { get; private set; }

    public Innovation Innovation { get; private set; } = null!;

    public Guid MunicipalityId { get; private set; }

    public Municipality Municipality { get; private set; } = null!;

    /// <summary>The newest year of the data the card is based on.</summary>
    public int DataYear { get; private set; }

    public FitLevel Fit { get; private set; }

    public string Summary { get; private set; } = null!;

    /// <summary>What can stay as the innovation describes it.</summary>
    public List<string> Unchanged { get; private set; } = [];

    public List<string> ToAdapt { get; private set; } = [];

    /// <summary>What the gmina lacks, with numbers from the data.</summary>
    public List<string> Missing { get; private set; } = [];

    /// <summary>Who would run it: OPS, CUS, an NGO.</summary>
    public string? ServiceProvider { get; private set; }

    /// <summary>In what form: a public task, a service.</summary>
    public string? ServiceForm { get; private set; }

    /// <summary>How many people it could reach, estimated from the data.</summary>
    public string? ScaleEstimate { get; private set; }

    public List<FitComparisonRow> Comparison { get; private set; } = [];

    public Guid CreatedByUserId { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    public static FitAssessment Assess(
        Innovation innovation,
        Municipality municipality,
        int dataYear,
        FitAssessmentContent content,
        Guid createdByUserId,
        DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(innovation);
        ArgumentNullException.ThrowIfNull(municipality);

        if (createdByUserId == Guid.Empty)
        {
            throw new InvalidOperationException("The author of a fit assessment has an empty id.");
        }

        var assessment = new FitAssessment
        {
            Id = Guid.CreateVersion7(),
            InnovationId = innovation.Id,
            Innovation = innovation,
            MunicipalityId = municipality.Id,
            Municipality = municipality,
            DataYear = dataYear,
            CreatedByUserId = createdByUserId,
            CreatedAt = createdAt,
        };

        assessment.Apply(content, createdAt);
        return assessment;
    }

    /// <summary>An administrator's recalculation: same innovation, gmina and data year, new content.</summary>
    public void Recalculate(FitAssessmentContent content, DateTimeOffset changedAt)
    {
        Apply(content, changedAt);
    }

    private static List<string> Items(IReadOnlyList<string> items)
    {
        return [.. items.Where(item => !string.IsNullOrWhiteSpace(item)).Select(item => item.Trim()).Take(MaxListItems)];
    }

    private void Apply(FitAssessmentContent content, DateTimeOffset changedAt)
    {
        ArgumentNullException.ThrowIfNull(content);

        if (string.IsNullOrWhiteSpace(content.Summary))
        {
            throw new InvalidOperationException("A fit assessment needs a summary; the assessor must not pass a blank one.");
        }

        Fit = content.Fit;
        Summary = content.Summary.Trim();
        Unchanged = Items(content.Unchanged);
        ToAdapt = Items(content.ToAdapt);
        Missing = Items(content.Missing);
        ServiceProvider = string.IsNullOrWhiteSpace(content.ServiceProvider) ? null : content.ServiceProvider.Trim();
        ServiceForm = string.IsNullOrWhiteSpace(content.ServiceForm) ? null : content.ServiceForm.Trim();
        ScaleEstimate = string.IsNullOrWhiteSpace(content.ScaleEstimate) ? null : content.ScaleEstimate.Trim();
        Comparison = [.. content.Comparison];
        UpdatedAt = changedAt;
    }
}
