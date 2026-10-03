using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Queries;

/// <summary>
/// Innovations with a genome that a ranking may choose from, best first: full-text hits for the keywords, then
/// innovations from the same challenge areas, then the rest. Without embeddings (docs/TODO.md) the rest stands in for
/// the vector search, as SPEC 6.4 allows — the library is small enough to give the model nearly all of it.
/// </summary>
public sealed class InnovationCandidatesQuery(CastorDbContext db)
{
    /// <summary>Keyword tokens in one search; more add noise rather than recall.</summary>
    private const int MaxSearchTokens = 12;

    public async Task<List<Innovation>> FindAsync(
        IReadOnlyList<string> keywords,
        IReadOnlyList<string> challengeAreaCodes,
        int limit,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(keywords);
        ArgumentNullException.ThrowIfNull(challengeAreaCodes);

        List<Guid> searchHits = await SearchAsync(keywords, limit, cancellationToken);
        List<Guid> ordered = [.. searchHits];

        if (ordered.Count < limit && challengeAreaCodes.Count > 0)
        {
            List<Guid> inAreas = await db.Innovations
                .Where(innovation => innovation.Genome != null
                    && innovation.Genome.ChallengeAreaCodes.Any(code => challengeAreaCodes.Contains(code))
                    && !ordered.Contains(innovation.Id))
                .OrderBy(innovation => innovation.Title)
                .Select(innovation => innovation.Id)
                .Take(limit - ordered.Count)
                .ToListAsync(cancellationToken);
            ordered.AddRange(inAreas);
        }

        if (ordered.Count < limit)
        {
            List<Guid> rest = await db.Innovations
                .Where(innovation => innovation.Genome != null && !ordered.Contains(innovation.Id))
                .OrderBy(innovation => innovation.Title)
                .Select(innovation => innovation.Id)
                .Take(limit - ordered.Count)
                .ToListAsync(cancellationToken);
            ordered.AddRange(rest);
        }

        List<Innovation> innovations = await db.Innovations
            .AsNoTracking()
            .Include(innovation => innovation.Genome)
            .Where(innovation => ordered.Contains(innovation.Id) && innovation.Genome != null)
            .ToListAsync(cancellationToken);

        return [.. innovations.OrderBy(innovation => ordered.IndexOf(innovation.Id))];
    }

    /// <summary>
    /// The search column holds words without diacritics in the 'simple' configuration, which does not stem Polish.
    /// Each keyword is cut to a prefix (opiekun, opiekunka, opiekunów → opieku:*) so its inflected forms match.
    /// </summary>
    private async Task<List<Guid>> SearchAsync(IReadOnlyList<string> keywords, int limit, CancellationToken cancellationToken)
    {
        string? tsQuery = PrefixQuery(keywords);
        if (tsQuery is null)
        {
            return [];
        }

        List<Guid> hits = await db.Database
            .SqlQuery<Guid>(
                $"""
                SELECT "Innovations"."Id" AS "Value"
                FROM "Innovations"
                JOIN "InnovationGenomes" ON "InnovationGenomes"."InnovationId" = "Innovations"."Id"
                WHERE "Innovations"."SearchVector" @@ to_tsquery('simple', castor_unaccent({tsQuery}))
                ORDER BY ts_rank("Innovations"."SearchVector", to_tsquery('simple', castor_unaccent({tsQuery}))) DESC
                LIMIT {limit}
                """)
            .ToListAsync(cancellationToken);

        return hits;
    }

    private static string? PrefixQuery(IReadOnlyList<string> keywords)
    {
        List<string> prefixes = [.. keywords
            .SelectMany(keyword => keyword.Split([' ', '-', ',', '/'], StringSplitOptions.RemoveEmptyEntries))
            .Select(LettersOnly)
            .Where(word => word.Length >= 3)
            .Select(Prefix)
            .Distinct(StringComparer.Ordinal)
            .Take(MaxSearchTokens)];

        if (prefixes.Count == 0)
        {
            return null;
        }

        return string.Join(" | ", prefixes.Select(prefix => $"{prefix}:*"));
    }

    /// <summary>Letters only, so nothing from the model can change the meaning of the tsquery.</summary>
    private static string LettersOnly(string word)
    {
        var letters = new StringBuilder(word.Length);
        foreach (char character in word)
        {
            if (char.IsLetter(character))
            {
                letters.Append(char.ToLower(character, CultureInfo.InvariantCulture));
            }
        }

        return letters.ToString();
    }

    /// <summary>Polish endings are one to three letters; a long word loses up to three, a short one stays whole.</summary>
    private static string Prefix(string word)
    {
        if (word.Length <= 5)
        {
            return word;
        }

        int keep = Math.Max(5, word.Length - 3);
        return word[..keep];
    }
}
