using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.ChallengeAreas;

/// <summary>One area of the Atlas: its definition, its personas and the approved plain-language text.</summary>
public sealed class GetChallengeAreaHandler(CastorDbContext db)
{
    public async Task<ChallengeAreaDetailsResponse> HandleAsync(string code, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(code);

        string areaCode = code.Trim();
        ChallengeArea area = await db.ChallengeAreas.AsNoTracking().SingleOrDefaultAsync(candidate => candidate.Code == areaCode, cancellationToken)
            ?? throw new DomainException("The challenge area does not exist.", StatusCodes.Status404NotFound);

        List<Persona> personas = await db.Personas
            .AsNoTracking()
            .Where(persona => persona.ChallengeAreaCode == area.Code)
            .OrderBy(persona => persona.Name)
            .ToListAsync(cancellationToken);

        string? plainText = area.PlainTextStatus == PlainTextStatus.APPROVED ? area.PlainText : null;
        List<PersonaResponse> personaResponses = [.. personas.Select(persona => new PersonaResponse(
            persona.Name,
            persona.Age,
            persona.Description,
            persona.Goals,
            persona.Challenges,
            persona.Motivations))];

        return new ChallengeAreaDetailsResponse(
            area.Code,
            area.Number,
            area.Name,
            area.Definition,
            area.KeyChallenges,
            area.Source,
            plainText,
            personaResponses);
    }
}
