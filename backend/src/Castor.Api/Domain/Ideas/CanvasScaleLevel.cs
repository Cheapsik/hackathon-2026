namespace Castor.Api.Domain;

/// <summary>One step of a four-step Canvas scale, from 1 (the mildest) to 4.</summary>
public sealed record CanvasScaleLevel(int Level, string Label, string Hint);
