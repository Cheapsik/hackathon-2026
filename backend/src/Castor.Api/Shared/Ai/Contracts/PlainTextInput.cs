namespace Castor.Api.Shared;

/// <param name="Title">The innovation or the challenge area the text belongs to.</param>
/// <param name="Text">The original description, already public.</param>
public sealed record PlainTextInput(string Title, string Text);
