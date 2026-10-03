using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.HasKey(message => message.Id);
        builder.Property(message => message.Text).HasMaxLength(Message.TextMaxLength);

        builder.HasOne<Conversation>()
            .WithMany()
            .HasForeignKey(message => message.ConversationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(message => message.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(message => new { message.ConversationId, message.PostedAt });

        builder.ToTable(table =>
        {
            // Only the holder of a report's tracking code writes without an account, always as the initiator.
            table.HasCheckConstraint("CK_Messages_AnonymousIsInitiator", "\"AuthorId\" IS NOT NULL OR \"SenderRole\" = 'INITIATOR'");
        });
    }
}
