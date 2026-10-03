namespace Castor.Api.Features.FitAssessments;

internal static class FitAssessmentConverter
{
    /// <summary>Needs <see cref="FitAssessment.Innovation"/> and <see cref="FitAssessment.Municipality"/> loaded.</summary>
    public static FitAssessmentResponse ToResponse(this FitAssessment assessment)
    {
        string fit = assessment.Fit.ToString();
        Municipality municipality = assessment.Municipality;
        var municipalityResponse = new FitAssessmentMunicipalityResponse(municipality.Teryt, municipality.QualifiedName, municipality.Powiat);
        List<FitComparisonRowResponse> comparison = [.. assessment.Comparison.Select(row => new FitComparisonRowResponse(
            row.Requirement,
            row.IndicatorName,
            row.Unit,
            row.Level.ToString(),
            row.Value,
            row.RegionAverage,
            row.Year))];

        return new FitAssessmentResponse(
            assessment.Id,
            assessment.InnovationId,
            assessment.Innovation.Title,
            municipalityResponse,
            assessment.DataYear,
            fit,
            assessment.Summary,
            assessment.Unchanged,
            assessment.ToAdapt,
            assessment.Missing,
            assessment.ServiceProvider,
            assessment.ServiceForm,
            assessment.ScaleEstimate,
            comparison,
            assessment.CreatedAt,
            assessment.UpdatedAt);
    }

    public static FitAssistantMessageResponse ToResponse(this FitAssistantMessage message)
    {
        string role = message.Role.ToString();

        return new FitAssistantMessageResponse(message.Id, role, message.Text, message.CreatedAt);
    }
}
