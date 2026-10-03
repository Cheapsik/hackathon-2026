using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class GrantCallConfiguration : IEntityTypeConfiguration<GrantCall>
{
    public void Configure(EntityTypeBuilder<GrantCall> builder)
    {
        builder.HasKey(grantCall => grantCall.Id);
        builder.Property(grantCall => grantCall.Title).HasMaxLength(GrantCall.TitleMaxLength);
        builder.Property(grantCall => grantCall.Description).HasMaxLength(GrantCall.DescriptionMaxLength);
        builder.HasIndex(grantCall => grantCall.Status);
        builder.Ignore(grantCall => grantCall.IsOpen);

        builder.ToTable(table =>
        {
            table.HasCheckConstraint(
                "CK_GrantCalls_ClosesAfterOpening",
                "\"OpensOn\" IS NULL OR \"ClosesOn\" IS NULL OR \"ClosesOn\" >= \"OpensOn\"");
        });
    }
}
