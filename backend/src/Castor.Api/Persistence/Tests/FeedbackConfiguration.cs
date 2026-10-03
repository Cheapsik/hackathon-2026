using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class FeedbackConfiguration : IEntityTypeConfiguration<Feedback>
{
    public void Configure(EntityTypeBuilder<Feedback> builder)
    {
        builder.HasKey(feedback => feedback.Id);
        builder.Property(feedback => feedback.WhatWorks).HasMaxLength(Feedback.CommentMaxLength);
        builder.Property(feedback => feedback.WhatToImprove).HasMaxLength(Feedback.CommentMaxLength);

        builder.HasOne<Innovation>()
            .WithMany()
            .HasForeignKey(feedback => feedback.InnovationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(feedback => feedback.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(feedback => new { feedback.InnovationId, feedback.AuthorId })
            .IsUnique()
            .HasDatabaseName("IX_Feedback_OnePerUserAndInnovation");

        builder.ToTable(table =>
        {
            table.HasCheckConstraint("CK_Feedback_Stars", $"\"Stars\" BETWEEN {Feedback.StarsMin} AND {Feedback.StarsMax}");
            table.HasCheckConstraint(
                "CK_Feedback_HasComment",
                "\"WhatWorks\" IS NOT NULL OR \"WhatToImprove\" IS NOT NULL");
        });
    }
}
