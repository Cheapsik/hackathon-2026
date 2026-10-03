using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class GrantApplicationConfiguration : IEntityTypeConfiguration<GrantApplication>
{
    public void Configure(EntityTypeBuilder<GrantApplication> builder)
    {
        builder.HasKey(application => application.Id);
        builder.Property(application => application.Title).HasMaxLength(GrantApplication.TitleMaxLength);
        builder.Property(application => application.Summary).HasMaxLength(GrantApplication.SummaryMaxLength);

        builder.HasOne<Idea>()
            .WithMany()
            .HasForeignKey(application => application.IdeaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<GrantCall>()
            .WithMany()
            .HasForeignKey(application => application.GrantCallId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(application => application.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // An idea applies once per call; generating again opens the existing application.
        builder.HasIndex(application => new { application.IdeaId, application.GrantCallId })
            .IsUnique()
            .HasDatabaseName("IX_GrantApplications_OnePerIdeaAndCall");

        builder.HasIndex(application => application.GrantCallId);

        builder.OwnsMany(application => application.Answers, answers => answers.ToJson());
    }
}
