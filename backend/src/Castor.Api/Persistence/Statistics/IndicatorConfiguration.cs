using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class IndicatorConfiguration : IEntityTypeConfiguration<Indicator>
{
    public void Configure(EntityTypeBuilder<Indicator> builder)
    {
        builder.HasKey(indicator => indicator.Id);
        builder.Property(indicator => indicator.Name).HasMaxLength(Indicator.NameMaxLength);
        builder.HasIndex(indicator => indicator.ObserverId).IsUnique().HasDatabaseName("IX_Indicators_UniqueObserverId");
    }
}
