namespace Castor.Api.Domain;

/// <summary>What an innovation needs in a gmina to take root: institutions, people, budget and infrastructure.</summary>
public sealed class RequiredResources
{
    private RequiredResources()
    {
    }

    public List<string> Institutions { get; private set; } = [];

    public List<string> People { get; private set; } = [];

    /// <summary>A description of the budget, e.g. "low cost: printed materials"; null when the card says nothing.</summary>
    public string? Budget { get; private set; }

    public List<string> Infrastructure { get; private set; } = [];

    public static RequiredResources Describe(
        IReadOnlyList<string> institutions,
        IReadOnlyList<string> people,
        string? budget,
        IReadOnlyList<string> infrastructure)
    {
        ArgumentNullException.ThrowIfNull(institutions);
        ArgumentNullException.ThrowIfNull(people);
        ArgumentNullException.ThrowIfNull(infrastructure);

        return new RequiredResources
        {
            Institutions = [.. institutions],
            People = [.. people],
            Budget = string.IsNullOrWhiteSpace(budget) ? null : budget.Trim(),
            Infrastructure = [.. infrastructure],
        };
    }
}
