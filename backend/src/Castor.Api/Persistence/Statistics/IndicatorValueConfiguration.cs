using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class IndicatorValueConfiguration : IEntityTypeConfiguration<IndicatorValue>
{
    public void Configure(EntityTypeBuilder<IndicatorValue> builder)
    {
        builder.HasKey(value => value.Id);
        builder.Property(value => value.TerritoryCode).HasMaxLength(IndicatorValue.TerritoryCodeMaxLength);

        builder.HasOne<Indicator>()
            .WithMany()
            .HasForeignKey(value => value.IndicatorId)
            .OnDelete(DeleteBehavior.Restrict);

        // One value per indicator, territory and year: the seed import upserts on this key.
        builder.HasIndex(value => new { value.IndicatorId, value.Level, value.TerritoryCode, value.Year })
            .IsUnique()
            .HasDatabaseName("IX_IndicatorValues_OnePerTerritoryAndYear");

        builder.HasIndex(value => new { value.Level, value.TerritoryCode });
    }
}
