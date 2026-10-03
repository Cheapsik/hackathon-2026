namespace Castor.Api.Features.PlainText;

/// <summary>A plain-language rewrite, including a draft. Only an administrator reads this; visitors get the approved text on the card.</summary>
public sealed record PlainTextResponse(string Text, string Status);
