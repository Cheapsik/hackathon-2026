namespace Castor.Api.Shared;

/// <summary>Input of the assistant prompt: the card it talks about, the chat so far and the new message.</summary>
public sealed record FitAssistantInput(
    string InnovationTitle,
    string MunicipalityName,
    string Fit,
    string Summary,
    IReadOnlyList<string> ToAdapt,
    IReadOnlyList<string> Missing,
    string? ServiceProvider,
    string? ServiceForm,
    IReadOnlyList<FitAssistantTurn> History,
    string Message);
