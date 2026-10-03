namespace Castor.Api.Persistence;

/// <param name="OpensInDays">Days from the import; negative for a call that opened before it.</param>
/// <param name="Status">DRAFT, OPEN or CLOSED.</param>
public sealed record DemoGrantCallSeed(
    string Title,
    string Description,
    List<string> Criteria,
    List<string> ChallengeAreas,
    int OpensInDays,
    int ClosesInDays,
    string Status);
