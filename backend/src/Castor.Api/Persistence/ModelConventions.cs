using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Castor.Api.Persistence;

/// <summary>
/// Numeric precision, temporal mapping, keys and enum storage, declared once for the whole model, so a new
/// entity cannot be added without them.
/// </summary>
public static class ModelConventions
{
    public const int Precision = 19;

    /// <summary>A bare decimal is a monetary amount.</summary>
    public const int AmountScale = 4;

    public static void ApplyTo(ModelConfigurationBuilder configurationBuilder)
    {
        ArgumentNullException.ThrowIfNull(configurationBuilder);

        configurationBuilder.Properties<decimal>()
            .HavePrecision(Precision, AmountScale);

        // A value with another scale gets its own type and its own line here.
        configurationBuilder.Properties<Measure>()
            .HaveConversion<MeasureConverter>()
            .HavePrecision(Precision, Measure.Scale);

        configurationBuilder.Properties<DateOnly>()
            .HaveColumnType("date");

        configurationBuilder.Properties<DateTimeOffset>()
            .HaveColumnType("timestamptz");
    }

    /// <summary>
    /// Keys come from <see cref="Guid.CreateVersion7()"/> in the domain, so neither EF Core nor the database
    /// may generate one. Enums are stored under the name they carry in the code, never as an ordinal.
    /// </summary>
    public static void ApplyTo(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        foreach (IMutableEntityType entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (IMutableProperty keyProperty in entityType.GetDeclaredKeys().SelectMany(key => key.Properties))
            {
                if (keyProperty.ClrType == typeof(Guid))
                {
                    keyProperty.ValueGenerated = ValueGenerated.Never;
                }
            }

            foreach (IMutableProperty property in entityType.GetDeclaredProperties())
            {
                Type? enumType = EnumTypeOrNull(property.ClrType);
                if (enumType is not null)
                {
                    ValueConverter enumToText = EnumToText(enumType);
                    property.SetValueConverter(enumToText);
                }
            }
        }
    }

    private static Type? EnumTypeOrNull(Type clrType)
    {
        Type underlying = Nullable.GetUnderlyingType(clrType) ?? clrType;

        return underlying.IsEnum ? underlying : null;
    }

    private static ValueConverter EnumToText(Type enumType)
    {
        Type converterType = typeof(EnumToStringConverter<>).MakeGenericType(enumType);
        return (ValueConverter)Activator.CreateInstance(converterType)!;
    }
}
