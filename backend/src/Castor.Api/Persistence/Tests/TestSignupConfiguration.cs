using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class TestSignupConfiguration : IEntityTypeConfiguration<TestSignup>
{
    public void Configure(EntityTypeBuilder<TestSignup> builder)
    {
        builder.HasKey(signup => signup.Id);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(signup => signup.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Innovation>()
            .WithMany()
            .HasForeignKey(signup => signup.InnovationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Idea>()
            .WithMany()
            .HasForeignKey(signup => signup.IdeaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(signup => new { signup.UserId, signup.InnovationId })
            .IsUnique()
            .HasFilter("\"InnovationId\" IS NOT NULL")
            .HasDatabaseName("IX_TestSignups_OnePerUserAndInnovation");

        builder.HasIndex(signup => new { signup.UserId, signup.IdeaId })
            .IsUnique()
            .HasFilter("\"IdeaId\" IS NOT NULL")
            .HasDatabaseName("IX_TestSignups_OnePerUserAndIdea");

        builder.ToTable(table => table.HasCheckConstraint(
            "CK_TestSignups_OneTarget",
            "(\"TargetKind\" = 'INNOVATION' AND \"InnovationId\" IS NOT NULL AND \"IdeaId\" IS NULL)"
            + " OR (\"TargetKind\" = 'IDEA' AND \"IdeaId\" IS NOT NULL AND \"InnovationId\" IS NULL)"));
    }
}
