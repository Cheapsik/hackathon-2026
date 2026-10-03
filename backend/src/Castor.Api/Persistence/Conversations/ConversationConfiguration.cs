using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class ConversationConfiguration : IEntityTypeConfiguration<Conversation>
{
    public void Configure(EntityTypeBuilder<Conversation> builder)
    {
        builder.HasKey(conversation => conversation.Id);
        builder.Property(conversation => conversation.Subject).HasMaxLength(Conversation.SubjectMaxLength);
        builder.Property(conversation => conversation.ChallengeAreaCode).HasMaxLength(ChallengeArea.CodeMaxLength);

        builder.HasOne(conversation => conversation.ProblemReport)
            .WithMany()
            .HasForeignKey(conversation => conversation.ProblemReportId)
            .OnDelete(DeleteBehavior.Restrict);

        // A report has exactly one thread.
        builder.HasIndex(conversation => conversation.ProblemReportId)
            .IsUnique()
            .HasDatabaseName("IX_Conversations_OnePerProblemReport");

        builder.HasOne(conversation => conversation.ChallengeArea)
            .WithMany()
            .HasForeignKey(conversation => conversation.ChallengeAreaCode)
            .HasPrincipalKey(area => area.Code)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(conversation => conversation.Innovation)
            .WithMany()
            .HasForeignKey(conversation => conversation.InnovationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(conversation => conversation.InitiatorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(conversation => conversation.LastMessageAt);

        // Each kind fills exactly the columns of what it is about.
        builder.ToTable(table =>
        {
            table.HasCheckConstraint(
                "CK_Conversations_KindFields",
                """
                ("Kind" = 'PROBLEM_REPORT' AND "ProblemReportId" IS NOT NULL AND "ChallengeAreaCode" IS NULL
                    AND "InnovationId" IS NULL AND "InitiatorId" IS NULL AND "Subject" IS NULL)
                OR ("Kind" = 'EXPERT_QUESTION' AND "ProblemReportId" IS NULL AND "ChallengeAreaCode" IS NOT NULL
                    AND "InnovationId" IS NULL AND "InitiatorId" IS NOT NULL AND "Subject" IS NOT NULL)
                OR ("Kind" = 'PARTNERSHIP' AND "ProblemReportId" IS NULL AND "ChallengeAreaCode" IS NULL
                    AND "InnovationId" IS NOT NULL AND "InitiatorId" IS NOT NULL AND "Subject" IS NOT NULL)
                """);
        });
    }
}
