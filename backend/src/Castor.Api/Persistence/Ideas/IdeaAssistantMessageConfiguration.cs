using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class IdeaAssistantMessageConfiguration : IEntityTypeConfiguration<IdeaAssistantMessage>
{
    public void Configure(EntityTypeBuilder<IdeaAssistantMessage> builder)
    {
        builder.HasKey(message => message.Id);
        builder.Property(message => message.Text).HasMaxLength(IdeaAssistantMessage.TextMaxLength);

        builder.HasOne<Idea>()
            .WithMany()
            .HasForeignKey(message => message.IdeaId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(message => message.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(message => new { message.IdeaId, message.UserId, message.CreatedAt });
    }
}
