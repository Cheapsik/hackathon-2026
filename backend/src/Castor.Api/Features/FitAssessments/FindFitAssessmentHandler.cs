using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.FitAssessments;

/// <summary>The stored card of an innovation for a gmina, newest data year first — what a visitor without an account sees.</summary>
public sealed class FindFitAssessmentHandler(CastorDbContext db)
{
    public async Task<FitAssessmentResponse> HandleAsync(Guid innovationId, string? teryt, CancellationToken cancellationToken)
    {
        string trimmed = teryt?.Trim() ?? string.Empty;

        FitAssessment assessment = await db.FitAssessments
                .AsNoTracking()
                .Include(candidate => candidate.Innovation)
                .Include(candidate => candidate.Municipality)
                .Where(candidate => candidate.InnovationId == innovationId && candidate.Municipality.Teryt == trimmed)
                .OrderByDescending(candidate => candidate.DataYear)
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new DomainException("No fit assessment has been generated for this municipality yet.", StatusCodes.Status404NotFound);

        return assessment.ToResponse();
    }
}
