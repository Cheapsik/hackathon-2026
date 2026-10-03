using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class MunicipalityConfiguration : IEntityTypeConfiguration<Municipality>
{
    public void Configure(EntityTypeBuilder<Municipality> builder)
    {
        builder.HasKey(municipality => municipality.Id);
        builder.Property(municipality => municipality.Teryt).HasMaxLength(Municipality.TerytLength).IsFixedLength();
        builder.HasIndex(municipality => municipality.Teryt).IsUnique().HasDatabaseName("IX_Municipalities_UniqueTeryt");
        builder.Ignore(municipality => municipality.QualifiedName);
    }
}
