namespace Castor.Api.Queries;

/// <summary>An application of the idea, with the title of its grant call.</summary>
public sealed record IdeaGrantApplicationView(
    Guid Id,
    Guid GrantCallId,
    string GrantCallTitle);
