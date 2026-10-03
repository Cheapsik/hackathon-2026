using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class FitAssessmentConfiguration : IEntityTypeConfiguration<FitAssessment>
{
    public void Configure(EntityTypeBuilder<FitAssessment> builder)
    {
        builder.HasKey(assessment => assessment.Id);

        builder.HasOne(assessment => assessment.Innovation)
            .WithMany()
            .HasForeignKey(assessment => assessment.InnovationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(assessment => assessment.Municipality)
            .WithMany()
            .HasForeignKey(assessment => assessment.MunicipalityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(assessment => assessment.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // A card is stored once per innovation, gmina and data year and reused instead of asking the model again.
        builder.HasIndex(assessment => new { assessment.InnovationId, assessment.MunicipalityId, assessment.DataYear })
            .IsUnique()
            .HasDatabaseName("IX_FitAssessments_OnePerInnovationMunicipalityAndYear");

        builder.OwnsMany(assessment => assessment.Comparison, rows => rows.ToJson());
    }
}
