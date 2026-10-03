using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Castor.Api.Persistence;

public sealed class MeasureConverter : ValueConverter<Measure, decimal>
{
    public MeasureConverter()
        : base(measure => measure.Value, value => new Measure(value))
    {
    }
}
