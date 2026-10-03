using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.FitAssessments;

/// <summary>
/// "Sprawdź dla mojej gminy": any signed-in user, for any gmina (SPEC 6.5). A card stored for the same innovation, gmina
/// and data year is returned instead of asking the model again.
/// </summary>
public sealed class CreateFitAssessmentHandler(
    CastorDbContext db,
    CurrentUser currentUser,
    MunicipalityPortraitQuery portraitQuery,
    FitAssessor assessor,
    IClock clock)
{
    public async Task<FitAssessmentOutcome> HandleAsync(
        Guid innovationId,
        CreateFitAssessmentRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        Guid userId = currentUser.UserId;
        Innovation innovation = await db.Innovations
                .Include(candidate => candidate.Genome)
                .SingleOrDefaultAsync(candidate => candidate.Id == innovationId, cancellationToken)
            ?? throw new DomainException("The innovation does not exist.", StatusCodes.Status404NotFound);

        InnovationGenome genome = innovation.Genome
            ?? throw new DomainException(
                "The innovation has no genome yet, so it cannot be assessed. Try again in a moment.",
                StatusCodes.Status409Conflict);

        Municipality municipality = await FindMunicipalityAsync(request.Teryt, cancellationToken);
        MunicipalityPortrait portrait = await portraitQuery.ForAsync(municipality, genome.ChallengeAreaCodes, cancellationToken);
        int dataYear = portrait.DataYear
            ?? throw new DomainException("The Obserwator has no data for this municipality.", StatusCodes.Status409Conflict);

        FitAssessment? stored = await FindStoredAsync(innovation.Id, municipality.Id, dataYear, cancellationToken);
        if (stored is not null)
        {
            FitAssessmentResponse storedResponse = stored.ToResponse();
            return new FitAssessmentOutcome(storedResponse, Created: false);
        }

        List<string> serviceModelExamples = await db.Innovations
            .AsNoTracking()
            .Where(candidate => candidate.InServiceModel)
            .OrderBy(candidate => candidate.Title)
            .Select(candidate => candidate.Title)
            .ToListAsync(cancellationToken);
        FitAssessmentContent content = await assessor.AssessAsync(innovation, portrait, serviceModelExamples, cancellationToken);

        var assessment = FitAssessment.Assess(innovation, municipality, dataYear, content, userId, clock.UtcNow);
        db.FitAssessments.Add(assessment);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (PostgresErrors.IsUniqueViolation(exception))
        {
            // Two people asked for the same card at once and the other request stored it first: show that one.
            db.ChangeTracker.Clear();
            FitAssessment winner = await FindStoredAsync(innovation.Id, municipality.Id, dataYear, cancellationToken)
                ?? throw new InvalidOperationException("A fit assessment collided with one that cannot be read back.");
            FitAssessmentResponse winnerResponse = winner.ToResponse();
            return new FitAssessmentOutcome(winnerResponse, Created: false);
        }

        FitAssessmentResponse response = assessment.ToResponse();
        return new FitAssessmentOutcome(response, Created: true);
    }

    private async Task<FitAssessment?> FindStoredAsync(
        Guid innovationId,
        Guid municipalityId,
        int dataYear,
        CancellationToken cancellationToken)
    {
        return await db.FitAssessments
            .Include(candidate => candidate.Innovation)
            .Include(candidate => candidate.Municipality)
            .SingleOrDefaultAsync(
                candidate => candidate.InnovationId == innovationId && candidate.MunicipalityId == municipalityId && candidate.DataYear == dataYear,
                cancellationToken);
    }

    private async Task<Municipality> FindMunicipalityAsync(string? teryt, CancellationToken cancellationToken)
    {
        string trimmed = teryt?.Trim() ?? string.Empty;
        if (trimmed.Length == 0)
        {
            throw new DomainException("Choose a municipality.");
        }

        return await db.Municipalities.SingleOrDefaultAsync(candidate => candidate.Teryt == trimmed, cancellationToken)
            ?? throw new DomainException("The municipality does not exist.");
    }
}
