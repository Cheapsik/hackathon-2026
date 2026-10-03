using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class FitAssistantMessageConfiguration : IEntityTypeConfiguration<FitAssistantMessage>
{
    public void Configure(EntityTypeBuilder<FitAssistantMessage> builder)
    {
        builder.HasKey(message => message.Id);
        builder.Property(message => message.Text).HasMaxLength(FitAssistantMessage.TextMaxLength);

        builder.HasOne<FitAssessment>()
            .WithMany()
            .HasForeignKey(message => message.FitAssessmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(message => message.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(message => new { message.FitAssessmentId, message.UserId, message.CreatedAt });
    }
}
