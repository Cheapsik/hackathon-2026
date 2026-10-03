using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Shared;

/// <summary>
/// Takes a stored problem report through the steps of matching it has not finished (SPEC 6.4): classification, then
/// matching once the questions are settled. Each finished step is saved at once. When the language model fails, the
/// report stays where it was — stored, with its tracking code — and the next request that opens it tries again, so a
/// report never stays unclassified for good.
/// </summary>
public sealed class ProblemReportMatching(
    CastorDbContext db,
    ProblemClassifier classifier,
    Matchmaker matchmaker,
    IClock clock,
    ILogger<ProblemReportMatching> logger)
{
    /// <param name="report">A report tracked by the same context.</param>
    public async Task CompleteAsync(ProblemReport report, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(report);

        if (report.ClassifiedAt is null)
        {
            ProblemClassification? classification = await TryClassifyAsync(report, cancellationToken);
            if (classification is null)
            {
                return;
            }

            report.Classify(
                classification.ChallengeAreas,
                classification.RootCauses,
                classification.TargetGroup,
                classification.Urgency,
                classification.Keywords,
                classification.ClarifyingQuestions,
                clock.UtcNow);
            await db.SaveChangesAsync(cancellationToken);
        }

        if (!report.IsReadyForMatching)
        {
            return;
        }

        IReadOnlyList<MatchResult>? matches = await TryMatchAsync(report, cancellationToken);
        if (matches is null)
        {
            return;
        }

        db.MatchResults.AddRange(matches);
        report.RecordMatches(clock.UtcNow);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (PostgresErrors.IsUniqueViolation(exception))
        {
            throw new DomainException(
                "The report was matched at the same time by another request. Open it again to see the results.",
                StatusCodes.Status409Conflict);
        }
    }

    private async Task<ProblemClassification?> TryClassifyAsync(ProblemReport report, CancellationToken cancellationToken)
    {
        try
        {
            List<ChallengeArea> challengeAreas = await db.ChallengeAreas.AsNoTracking().OrderBy(area => area.Number).ToListAsync(cancellationToken);
            return await classifier.ClassifyAsync(report.Description, challengeAreas, cancellationToken);
        }
        catch (Exception exception) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogError(exception, "Problem report {ReportId} could not be classified; opening it again retries.", report.Id);
            return null;
        }
    }

    private async Task<IReadOnlyList<MatchResult>?> TryMatchAsync(ProblemReport report, CancellationToken cancellationToken)
    {
        try
        {
            return await matchmaker.MatchAsync(report, clock.UtcNow, cancellationToken);
        }
        catch (Exception exception) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogError(exception, "Problem report {ReportId} could not be matched; opening it again retries.", report.Id);
            return null;
        }
    }
}
