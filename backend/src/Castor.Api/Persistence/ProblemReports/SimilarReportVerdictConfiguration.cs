using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class SimilarReportVerdictConfiguration : IEntityTypeConfiguration<SimilarReportVerdict>
{
    public void Configure(EntityTypeBuilder<SimilarReportVerdict> builder)
    {
        builder.HasKey(verdict => verdict.Id);

        // Anonymization can lengthen the text, as with the description.
        builder.Property(verdict => verdict.Note).HasMaxLength(2 * ProblemReport.VerdictNoteMaxLength);

        builder.HasOne<ProblemReport>()
            .WithMany()
            .HasForeignKey(verdict => verdict.ProblemReportId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ProblemReport>()
            .WithMany()
            .HasForeignKey(verdict => verdict.SimilarProblemReportId)
            .OnDelete(DeleteBehavior.Restrict);

        // One verdict per pair: two clicks at once cannot record two.
        builder.HasIndex(verdict => new { verdict.ProblemReportId, verdict.SimilarProblemReportId })
            .IsUnique()
            .HasDatabaseName("IX_SimilarReportVerdicts_OnePerPair");

        builder.HasIndex(verdict => verdict.SimilarProblemReportId);
    }
}
