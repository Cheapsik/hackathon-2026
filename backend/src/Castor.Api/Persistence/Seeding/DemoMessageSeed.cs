namespace Castor.Api.Persistence;

/// <param name="Sender">
/// An account key — it writes as ADMIN, EXPERT or the initiator, by its role. Null in a report's thread: the visitor who
/// holds the tracking code of an anonymous report.
/// </param>
public sealed record DemoMessageSeed(
    string? Sender,
    int DaysAgo,
    string Text);
