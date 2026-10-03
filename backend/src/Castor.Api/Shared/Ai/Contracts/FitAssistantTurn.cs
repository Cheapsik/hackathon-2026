namespace Castor.Api.Shared;

/// <summary>One earlier message of the assistant chat.</summary>
public sealed record FitAssistantTurn(
    string Role,
    string Text);
