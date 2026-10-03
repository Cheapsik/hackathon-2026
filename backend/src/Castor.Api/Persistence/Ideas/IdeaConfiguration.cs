using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class IdeaConfiguration : IEntityTypeConfiguration<Idea>
{
    public void Configure(EntityTypeBuilder<Idea> builder)
    {
        builder.HasKey(idea => idea.Id);
        builder.Property(idea => idea.Title).HasMaxLength(Idea.TitleMaxLength);
        builder.Property(idea => idea.OtherRecipients).HasMaxLength(Idea.OtherRecipientsMaxLength);
        builder.Property(idea => idea.Solution).HasMaxLength(Idea.SolutionMaxLength);
        builder.Property(idea => idea.Supporters).HasMaxLength(Idea.ActorsMaxLength);
        builder.Property(idea => idea.Opponents).HasMaxLength(Idea.ActorsMaxLength);
        builder.Property(idea => idea.DifferenceNote).HasMaxLength(Idea.DifferenceNoteMaxLength);
        builder.Property(idea => idea.SimilarFingerprint).HasMaxLength(Idea.FingerprintLength).IsFixedLength();

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(idea => idea.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Innovation>()
            .WithMany()
            .HasForeignKey(idea => idea.StartingInnovationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(idea => idea.CoAuthors)
            .WithOne()
            .HasForeignKey(coAuthor => coAuthor.IdeaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(idea => idea.AuthorId);
        builder.HasIndex(idea => new { idea.Status, idea.SubmittedAt });

        builder.OwnsMany(idea => idea.Similar, similar => similar.ToJson());

        builder.ToTable(table =>
        {
            table.HasCheckConstraint(
                "CK_Ideas_ProblemScales",
                "(\"ProblemIntensity\" IS NULL OR \"ProblemIntensity\" BETWEEN 1 AND 4)"
                + " AND (\"ProblemFrequency\" IS NULL OR \"ProblemFrequency\" BETWEEN 1 AND 4)"
                + " AND (\"ProblemScale\" IS NULL OR \"ProblemScale\" BETWEEN 1 AND 4)");
            table.HasCheckConstraint("CK_Ideas_AtMostThreeChallengeAreas", "cardinality(\"ChallengeAreaCodes\") <= 3");
            table.HasCheckConstraint(
                "CK_Ideas_SubmittedHasDate",
                "\"Status\" = 'DRAFT' OR \"SubmittedAt\" IS NOT NULL");
            table.HasCheckConstraint(
                "CK_Ideas_DecidedHasDate",
                "\"Status\" NOT IN ('ACCEPTED', 'REJECTED') OR \"DecidedAt\" IS NOT NULL");
        });
    }
}
