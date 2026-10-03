using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NpgsqlTypes;

namespace Castor.Api.Persistence;

public sealed class InnovationConfiguration : IEntityTypeConfiguration<Innovation>
{
    /// <summary>
    /// A generated column for full-text search. PostgreSQL has no Polish dictionary, so the text goes through the
    /// 'simple' configuration without diacritics (castor_unaccent, created by the migration); queries use word
    /// prefixes to make up for the missing stemming.
    /// </summary>
    public const string SearchVectorColumn = "SearchVector";

    public void Configure(EntityTypeBuilder<Innovation> builder)
    {
        builder.HasKey(innovation => innovation.Id);
        builder.Property(innovation => innovation.SourceKey).HasMaxLength(Innovation.SourceKeyMaxLength);
        builder.Property(innovation => innovation.Title).HasMaxLength(Innovation.TitleMaxLength);

        builder.HasIndex(innovation => innovation.SourceKey)
            .IsUnique()
            .HasDatabaseName("IX_Innovations_UniqueSourceKey");

        builder.HasOne(innovation => innovation.Genome)
            .WithOne()
            .HasForeignKey<InnovationGenome>(genome => genome.InnovationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property<NpgsqlTsVector>(SearchVectorColumn)
            .HasComputedColumnSql(
                """
                to_tsvector('simple', castor_unaccent(
                    coalesce("Title", '') || ' ' || coalesce("ShortDescription", '') || ' ' ||
                    coalesce("Solution", '') || ' ' || coalesce("Problems", '') || ' ' ||
                    coalesce("TargetGroup", '') || ' ' || coalesce("Beneficiaries", '')))
                """,
                stored: true);

        builder.HasIndex(SearchVectorColumn).HasMethod("GIN").HasDatabaseName("IX_Innovations_Search");
    }
}
