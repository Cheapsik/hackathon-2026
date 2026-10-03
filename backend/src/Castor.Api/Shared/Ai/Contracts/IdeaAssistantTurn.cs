namespace Castor.Api.Shared;

/// <summary>One earlier message of the Kreator's assistant chat.</summary>
public sealed record IdeaAssistantTurn(
    string Role,
    string Text);
