using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.FitAssessments;

public sealed class GetFitAssessmentHandler(CastorDbContext db)
{
    public async Task<FitAssessmentResponse> HandleAsync(Guid innovationId, Guid fitAssessmentId, CancellationToken cancellationToken)
    {
        FitAssessment assessment = await db.FitAssessments
                .AsNoTracking()
                .Include(candidate => candidate.Innovation)
                .Include(candidate => candidate.Municipality)
                .SingleOrDefaultAsync(
                    candidate => candidate.Id == fitAssessmentId && candidate.InnovationId == innovationId,
                    cancellationToken)
            ?? throw new DomainException("The fit assessment does not exist.", StatusCodes.Status404NotFound);

        return assessment.ToResponse();
    }
}
