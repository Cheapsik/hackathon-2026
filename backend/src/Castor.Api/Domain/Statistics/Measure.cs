using System.Globalization;

namespace Castor.Api.Domain;

/// <summary>
/// A statistical value — a rate, a share, a count per thousand — not an amount of money, so it carries its own scale
/// instead of the convention for a bare <see cref="decimal"/> (docs/architecture/00-stack.md, Liczby).
/// </summary>
public readonly record struct Measure(decimal Value)
{
    public const int Scale = 8;

    public override string ToString()
    {
        return Value.ToString(CultureInfo.InvariantCulture);
    }
}
