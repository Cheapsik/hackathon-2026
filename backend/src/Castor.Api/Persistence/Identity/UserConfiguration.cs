using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(user => user.Id);
        builder.Property(user => user.Email).HasMaxLength(User.EmailMaxLength);
        builder.HasIndex(user => user.Email).IsUnique();

        builder.HasOne<Municipality>()
            .WithMany()
            .HasForeignKey(user => user.MunicipalityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.OwnsOne(user => user.TesterProfile, profile =>
        {
            profile.Property(part => part.AccessibilityNeeds).HasMaxLength(TesterProfile.NeedsMaxLength);
            profile.Property(part => part.Equipment).HasMaxLength(TesterProfile.EquipmentMaxLength);
            profile.HasOne<Municipality>()
                .WithMany()
                .HasForeignKey(part => part.MunicipalityId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
