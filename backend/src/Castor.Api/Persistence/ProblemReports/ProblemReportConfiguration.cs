using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class ProblemReportConfiguration : IEntityTypeConfiguration<ProblemReport>
{
    public void Configure(EntityTypeBuilder<ProblemReport> builder)
    {
        builder.HasKey(report => report.Id);
        builder.Property(report => report.TrackingCode).HasMaxLength(TrackingCode.Length).IsFixedLength();
        builder.Property(report => report.Description).HasMaxLength(ProblemReport.DescriptionMaxLength);
        builder.Property(report => report.OriginalDescription).HasMaxLength(ProblemReport.DescriptionMaxLength);

        // The code works like a password, so it must never point at two reports.
        builder.HasIndex(report => report.TrackingCode)
            .IsUnique()
            .HasDatabaseName("IX_ProblemReports_UniqueTrackingCode");

        builder.HasOne(report => report.Municipality)
            .WithMany()
            .HasForeignKey(report => report.MunicipalityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(report => report.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(report => report.AuthorId);

        builder.OwnsMany(report => report.ClarifyingQuestions, questions => questions.ToJson());

        builder.Ignore(report => report.AwaitsAnswers);
        builder.Ignore(report => report.IsReadyForMatching);
        builder.Ignore(report => report.MainChallengeAreaCode);
    }
}
