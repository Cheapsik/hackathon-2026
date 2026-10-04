namespace Castor.Api.Features.ProblemReports;

/// <param name="Verdict">NO, YES or ALMOST.</param>
/// <param name="Note">What the innovation lacks; required for ALMOST.</param>
public sealed record DecideOnMatchRequest(string? Verdict, string? Note);
