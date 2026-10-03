using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class InnovationGenomeConfiguration : IEntityTypeConfiguration<InnovationGenome>
{
    public void Configure(EntityTypeBuilder<InnovationGenome> builder)
    {
        builder.HasKey(genome => genome.Id);
        builder.Property(genome => genome.Summary).HasMaxLength(InnovationGenome.SummaryMaxLength);
        builder.HasIndex(genome => genome.InnovationId).IsUnique().HasDatabaseName("IX_InnovationGenomes_OnePerInnovation");

        builder.OwnsOne(genome => genome.RequiredResources, resources => resources.ToJson());

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(genome => genome.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
