using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.FitAssessments;

/// <summary>An administrator computes a stored card again, e.g. after correcting the genome (SPEC 6.5).</summary>
public sealed class RecalculateFitAssessmentHandler(
    CastorDbContext db,
    MunicipalityPortraitQuery portraitQuery,
    FitAssessor assessor,
    IClock clock)
{
    public async Task<FitAssessmentResponse> HandleAsync(Guid innovationId, Guid fitAssessmentId, CancellationToken cancellationToken)
    {
        FitAssessment assessment = await db.FitAssessments
                .Include(candidate => candidate.Innovation)
                .ThenInclude(innovation => innovation.Genome)
                .Include(candidate => candidate.Municipality)
                .SingleOrDefaultAsync(
                    candidate => candidate.Id == fitAssessmentId && candidate.InnovationId == innovationId,
                    cancellationToken)
            ?? throw new DomainException("The fit assessment does not exist.", StatusCodes.Status404NotFound);

        InnovationGenome genome = assessment.Innovation.Genome
            ?? throw new DomainException("The innovation has no genome to assess against.", StatusCodes.Status409Conflict);

        MunicipalityPortrait portrait = await portraitQuery.ForAsync(assessment.Municipality, genome.ChallengeAreaCodes, cancellationToken);
        List<string> serviceModelExamples = await db.Innovations
            .AsNoTracking()
            .Where(candidate => candidate.InServiceModel)
            .OrderBy(candidate => candidate.Title)
            .Select(candidate => candidate.Title)
            .ToListAsync(cancellationToken);
        FitAssessmentContent content = await assessor.AssessAsync(assessment.Innovation, portrait, serviceModelExamples, cancellationToken);

        assessment.Recalculate(content, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        return assessment.ToResponse();
    }
}
