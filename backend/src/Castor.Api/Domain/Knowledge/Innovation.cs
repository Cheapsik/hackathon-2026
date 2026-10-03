namespace Castor.Api.Domain;

/// <summary>
/// A proven social solution, described by a card of six sections. Innovations from the ROPS library come from the
/// seed; an innovation grown from a user's idea comes later (module III). Materials are linked, never copied.
/// </summary>
public sealed class Innovation
{
    public const int SourceKeyMaxLength = 200;

    public const int TitleMaxLength = 300;

    private Innovation()
    {
    }

    public Guid Id { get; private set; }

    /// <summary>The slug of the ROPS card; the seed import finds an innovation again by it. Null for user innovations.</summary>
    public string? SourceKey { get; private set; }

    public string Title { get; private set; } = null!;

    public string? ShortDescription { get; private set; }

    /// <summary>Library categories; one innovation can be listed in several.</summary>
    public List<string> Categories { get; private set; } = [];

    /// <summary>Card section 1: what the solution is.</summary>
    public string? Solution { get; private set; }

    /// <summary>Card section 2: which problems it answers.</summary>
    public string? Problems { get; private set; }

    /// <summary>Card section 3: the target group.</summary>
    public string? TargetGroup { get; private set; }

    /// <summary>Card section 4: who can use the innovation.</summary>
    public string? Beneficiaries { get; private set; }

    /// <summary>Card section 5: does it work.</summary>
    public string? Evidence { get; private set; }

    /// <summary>Card section 6 reduced to institutions; names of people are never stored.</summary>
    public string? Organization { get; private set; }

    public string? CardUrl { get; private set; }

    public string? VideoUrl { get; private set; }

    public string? MaterialsZipUrl { get; private set; }

    public string? CardPdfUrl { get; private set; }

    /// <summary>The terms of use (a licence page or a PDF).</summary>
    public string? TermsUrl { get; private set; }

    /// <summary>Selected for dissemination.</summary>
    public bool Featured { get; private set; }

    /// <summary>Part of the Małopolska Models of Social Services.</summary>
    public bool InServiceModel { get; private set; }

    public InnovationStage Stage { get; private set; }

    public InnovationSource Source { get; private set; }

    public bool SeeksTesters { get; private set; }

    public InnovationGenome? Genome { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset UpdatedAt { get; private set; }

    /// <summary>
    /// An innovation from the ROPS library. The library publishes tested solutions, so the stage is
    /// <see cref="InnovationStage.TESTED"/>.
    /// </summary>
    public static Innovation ImportFromLibrary(
        string sourceKey,
        string title,
        string? shortDescription,
        IReadOnlyList<string> categories,
        InnovationCardSections sections,
        string? organization,
        InnovationLinks links,
        bool featured,
        bool inServiceModel,
        DateTimeOffset importedAt)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sourceKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentNullException.ThrowIfNull(categories);
        ArgumentNullException.ThrowIfNull(sections);
        ArgumentNullException.ThrowIfNull(links);

        return new Innovation
        {
            Id = Guid.CreateVersion7(),
            SourceKey = sourceKey,
            Title = title,
            ShortDescription = NullIfBlank(shortDescription),
            Categories = [.. categories],
            Solution = NullIfBlank(sections.Solution),
            Problems = NullIfBlank(sections.Problems),
            TargetGroup = NullIfBlank(sections.TargetGroup),
            Beneficiaries = NullIfBlank(sections.Beneficiaries),
            Evidence = NullIfBlank(sections.Evidence),
            Organization = NullIfBlank(organization),
            CardUrl = NullIfBlank(links.CardUrl),
            VideoUrl = NullIfBlank(links.VideoUrl),
            MaterialsZipUrl = NullIfBlank(links.MaterialsZipUrl),
            CardPdfUrl = NullIfBlank(links.CardPdfUrl),
            TermsUrl = NullIfBlank(links.TermsUrl),
            Featured = featured,
            InServiceModel = inServiceModel,
            Stage = InnovationStage.TESTED,
            Source = InnovationSource.ROPS,
            SeeksTesters = false,
            CreatedAt = importedAt,
            UpdatedAt = importedAt,
        };
    }

    /// <summary>An innovation an administrator enters by hand (module VI), e.g. one the seed does not have yet.</summary>
    public static Innovation Create(
        string? title,
        string? shortDescription,
        IReadOnlyList<string> categories,
        InnovationCardSections sections,
        string? organization,
        InnovationLinks links,
        InnovationStage stage,
        DateTimeOffset createdAt)
    {
        var innovation = new Innovation
        {
            Id = Guid.CreateVersion7(),
            Source = InnovationSource.ROPS,
            CreatedAt = createdAt,
        };

        innovation.Revise(title, shortDescription, categories, sections, organization, links, stage, createdAt);
        return innovation;
    }

    /// <summary>
    /// An administrator rewrites the card. The genome is not touched: it describes the old text until the administrator
    /// recalculates it.
    /// </summary>
    public void Revise(
        string? title,
        string? shortDescription,
        IReadOnlyList<string> categories,
        InnovationCardSections sections,
        string? organization,
        InnovationLinks links,
        InnovationStage stage,
        DateTimeOffset changedAt)
    {
        ArgumentNullException.ThrowIfNull(categories);
        ArgumentNullException.ThrowIfNull(sections);
        ArgumentNullException.ThrowIfNull(links);

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new DomainException("An innovation needs a title.");
        }

        string trimmedTitle = title.Trim();
        if (trimmedTitle.Length > TitleMaxLength)
        {
            throw new DomainException($"An innovation title has at most {TitleMaxLength} characters.");
        }

        if (string.IsNullOrWhiteSpace(sections.Solution))
        {
            throw new DomainException("An innovation card needs section 1: what the solution is.");
        }

        Title = trimmedTitle;
        ShortDescription = NullIfBlank(shortDescription);
        Categories = [.. categories.Where(category => !string.IsNullOrWhiteSpace(category)).Select(category => category.Trim())];
        Solution = NullIfBlank(sections.Solution);
        Problems = NullIfBlank(sections.Problems);
        TargetGroup = NullIfBlank(sections.TargetGroup);
        Beneficiaries = NullIfBlank(sections.Beneficiaries);
        Evidence = NullIfBlank(sections.Evidence);
        Organization = NullIfBlank(organization);
        CardUrl = NullIfBlank(links.CardUrl);
        VideoUrl = NullIfBlank(links.VideoUrl);
        MaterialsZipUrl = NullIfBlank(links.MaterialsZipUrl);
        CardPdfUrl = NullIfBlank(links.CardPdfUrl);
        TermsUrl = NullIfBlank(links.TermsUrl);
        Stage = stage;
        UpdatedAt = changedAt;
    }

    private static string? NullIfBlank(string? text)
    {
        return string.IsNullOrWhiteSpace(text) ? null : text.Trim();
    }
}
