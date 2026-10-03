using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class IdeaReviewConfiguration : IEntityTypeConfiguration<IdeaReview>
{
    public void Configure(EntityTypeBuilder<IdeaReview> builder)
    {
        builder.HasKey(review => review.Id);
        builder.Property(review => review.Comment).HasMaxLength(IdeaReview.CommentMaxLength);

        builder.HasOne<Idea>()
            .WithMany()
            .HasForeignKey(review => review.IdeaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(review => review.ExpertId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(review => new { review.IdeaId, review.ExpertId })
            .IsUnique()
            .HasDatabaseName("IX_IdeaReviews_OnePerIdeaAndExpert");
    }
}
