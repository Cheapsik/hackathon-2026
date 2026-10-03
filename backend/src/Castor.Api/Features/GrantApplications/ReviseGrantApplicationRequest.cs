namespace Castor.Api.Features.GrantApplications;

/// <param name="Answers">One per criterion of the application, in its order; null or empty leaves a criterion open.</param>
public sealed record ReviseGrantApplicationRequest(
    string? Title,
    string? Summary,
    IReadOnlyList<string?>? Answers);
