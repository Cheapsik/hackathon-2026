using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class BackgroundJobConfiguration : IEntityTypeConfiguration<BackgroundJob>
{
    public void Configure(EntityTypeBuilder<BackgroundJob> builder)
    {
        builder.HasKey(job => job.Id);
        builder.Property(job => job.Error).HasMaxLength(BackgroundJob.ErrorMaxLength);
        builder.HasIndex(job => job.Status);
        builder.Ignore(job => job.IsFinished);
    }
}
