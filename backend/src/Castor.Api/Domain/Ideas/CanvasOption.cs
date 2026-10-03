namespace Castor.Api.Domain;

/// <summary>One choice of a Canvas list: its code (stored) and its words from the Canvas (shown and given to the model).</summary>
public sealed record CanvasOption(string Code, string Label, string? Hint);
