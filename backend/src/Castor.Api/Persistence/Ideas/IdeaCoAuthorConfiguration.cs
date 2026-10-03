using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class IdeaCoAuthorConfiguration : IEntityTypeConfiguration<IdeaCoAuthor>
{
    public void Configure(EntityTypeBuilder<IdeaCoAuthor> builder)
    {
        // Two clicks on "Dołącz" at once cannot make a user a co-author twice.
        builder.HasKey(coAuthor => new { coAuthor.IdeaId, coAuthor.UserId });

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(coAuthor => coAuthor.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(coAuthor => coAuthor.UserId);
    }
}
