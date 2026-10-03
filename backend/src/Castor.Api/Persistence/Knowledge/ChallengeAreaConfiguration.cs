using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class ChallengeAreaConfiguration : IEntityTypeConfiguration<ChallengeArea>
{
    public void Configure(EntityTypeBuilder<ChallengeArea> builder)
    {
        builder.HasKey(area => area.Id);
        builder.Property(area => area.Code).HasMaxLength(ChallengeArea.CodeMaxLength);

        // Other records point at an area by its code, so the code is an alternate key — unique by itself.
        builder.HasAlternateKey(area => area.Code).HasName("AK_ChallengeAreas_Code");

        builder.Property(area => area.PlainText).HasMaxLength(ChallengeArea.PlainTextMaxLength);
        builder.ToTable(table => table.HasCheckConstraint(
            "CK_ChallengeAreas_PlainTextHasStatus",
            "(\"PlainText\" IS NULL) = (\"PlainTextStatus\" IS NULL)"));
    }
}
