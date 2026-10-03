using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Castor.Api.Persistence;

public sealed class PersonaConfiguration : IEntityTypeConfiguration<Persona>
{
    public void Configure(EntityTypeBuilder<Persona> builder)
    {
        builder.HasKey(persona => persona.Id);
        builder.Property(persona => persona.Name).HasMaxLength(Persona.NameMaxLength);
        builder.Property(persona => persona.ChallengeAreaCode).HasMaxLength(ChallengeArea.CodeMaxLength);
        builder.HasIndex(persona => persona.Name).IsUnique().HasDatabaseName("IX_Personas_UniqueName");

        builder.HasOne<ChallengeArea>()
            .WithMany()
            .HasForeignKey(persona => persona.ChallengeAreaCode)
            .HasPrincipalKey(area => area.Code)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
