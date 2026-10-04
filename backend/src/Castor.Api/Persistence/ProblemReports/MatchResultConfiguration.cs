using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class MatchResultConfiguration : IEntityTypeConfiguration<MatchResult>
{
    public void Configure(EntityTypeBuilder<MatchResult> builder)
    {
        builder.HasKey(match => match.Id);

        builder.HasOne<ProblemReport>()
            .WithMany()
            .HasForeignKey(match => match.ProblemReportId)
            .OnDelete(DeleteBehavior.Restrict);

        // Anonymization can lengthen the text, as with the description.
        builder.Property(match => match.VerdictNote).HasMaxLength(2 * ProblemReport.VerdictNoteMaxLength);

        builder.HasOne(match => match.Innovation)
            .WithMany()
            .HasForeignKey(match => match.InnovationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(match => new { match.ProblemReportId, match.Position })
            .IsUnique()
            .HasDatabaseName("IX_MatchResults_OnePerPosition");

        builder.ToTable(table =>
        {
            table.HasCheckConstraint(
                "CK_MatchResults_ScoreRange",
                $"\"Score\" IS NULL OR \"Score\" BETWEEN {MatchResult.MinScore} AND {MatchResult.MaxScore}");
            table.HasCheckConstraint(
                "CK_MatchResults_KindShape",
                "(\"Kind\" = 'MATCH' AND \"InnovationId\" IS NOT NULL AND \"Score\" IS NOT NULL) OR "
                + "(\"Kind\" = 'HYBRID' AND \"InnovationId\" IS NULL AND \"HybridName\" IS NOT NULL)");
        });
    }
}
