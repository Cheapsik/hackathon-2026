namespace Castor.Api.Persistence;

/// <summary>A rating of a library innovation on Poletko.</summary>
public sealed record DemoFeedbackSeed(
    string Author,
    string Innovation,
    int Stars,
    string? WhatWorks,
    string? WhatToImprove);
