namespace Castor.Api.Features.ProblemReports;

/// <param name="MunicipalityTeryt">The gmina the problem concerns; optional.</param>
/// <param name="SubmittedOnBehalf">"Zgłaszam w czyimś imieniu": the report is ASSISTED.</param>
/// <param name="Dictated">The description was dictated with the microphone (channel VOICE).</param>
/// <param name="KeepOriginalDescription">Consent to store the description as written; off by default.</param>
public sealed record CreateProblemReportRequest(
    string? Description,
    string? MunicipalityTeryt,
    bool SubmittedOnBehalf,
    bool Dictated,
    bool KeepOriginalDescription);
