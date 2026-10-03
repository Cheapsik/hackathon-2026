using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Persistence;

/// <summary>
/// Imports <c>data/seed/*.json</c> at start-up (ADR 0003): content — challenge areas, personas, innovations — is only
/// added, found again by its source key, so an administrator's edits survive a restart; register statistics —
/// municipalities — are upserted. Genomes are not computed here: the importer queues a background job for them.
/// </summary>
public sealed class SeedImporter(
    CastorDbContext db,
    BackgroundJobScheduler jobs,
    IClock clock,
    ILogger<SeedImporter> logger)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task ImportAsync(string seedPath, CancellationToken cancellationToken)
    {
        if (!Directory.Exists(seedPath))
        {
            throw new InvalidOperationException($"Seed:Path '{seedPath}' is not a directory.");
        }

        DateTimeOffset now = clock.UtcNow;

        List<ChallengeAreaSeed> areas = await ReadAsync<ChallengeAreaSeed>(seedPath, "challenge_areas.json", cancellationToken);
        int addedAreas = await ImportChallengeAreasAsync(areas, now, cancellationToken);

        List<PersonaSeed> personas = await ReadAsync<PersonaSeed>(seedPath, "personas.json", cancellationToken);
        int addedPersonas = await ImportPersonasAsync(personas, now, cancellationToken);

        List<MunicipalitySeed> municipalities = await ReadAsync<MunicipalitySeed>(seedPath, "municipalities.json", cancellationToken);
        int upsertedMunicipalities = await UpsertMunicipalitiesAsync(municipalities, now, cancellationToken);

        List<InnovationSeed> innovations = await ReadAsync<InnovationSeed>(seedPath, "innovations.json", cancellationToken);
        int addedInnovations = await ImportInnovationsAsync(innovations, now, cancellationToken);

        List<IndicatorSeed> indicators = await ReadAsync<IndicatorSeed>(seedPath, "indicators.json", cancellationToken);
        Dictionary<int, Indicator> indicatorsByObserverId = await UpsertIndicatorsAsync(indicators, now, cancellationToken);

        List<IndicatorValueSeed> values = await ReadAsync<IndicatorValueSeed>(seedPath, "indicator_values.json", cancellationToken);
        int upsertedValues = await UpsertIndicatorValuesAsync(values, indicatorsByObserverId, now, cancellationToken);

        logger.LogInformation(
            "Seed imported: {Areas} challenge areas, {Personas} personas, {Innovations} innovations added; {Municipalities} municipalities, {Indicators} indicators and {Values} indicator values upserted.",
            addedAreas,
            addedPersonas,
            addedInnovations,
            upsertedMunicipalities,
            indicatorsByObserverId.Count,
            upsertedValues);

        bool missingGenomes = await db.Innovations.AnyAsync(innovation => innovation.Genome == null, cancellationToken);
        if (missingGenomes)
        {
            await jobs.QueueAsync(BackgroundJobKind.GENERATE_GENOMES, cancellationToken);
        }
    }

    private static async Task<List<TSeed>> ReadAsync<TSeed>(string seedPath, string fileName, CancellationToken cancellationToken)
    {
        string path = Path.Combine(seedPath, fileName);
        await using FileStream stream = File.OpenRead(path);
        List<TSeed>? entries = await JsonSerializer.DeserializeAsync<List<TSeed>>(stream, Json, cancellationToken);

        return entries ?? throw new InvalidOperationException($"Seed file {path} is empty.");
    }

    private async Task<int> ImportChallengeAreasAsync(List<ChallengeAreaSeed> seeds, DateTimeOffset now, CancellationToken cancellationToken)
    {
        List<string> existingCodes = await db.ChallengeAreas.Select(area => area.Code).ToListAsync(cancellationToken);
        HashSet<string> existing = [.. existingCodes];
        List<ChallengeAreaSeed> added = [.. seeds.Where(seed => !existing.Contains(seed.Code))];

        foreach (ChallengeAreaSeed seed in added)
        {
            var area = ChallengeArea.Import(seed.Code, seed.Number, seed.Name, seed.Definition, seed.KeyChallenges, seed.Source, now);
            db.ChallengeAreas.Add(area);
        }

        await db.SaveChangesAsync(cancellationToken);
        return added.Count;
    }

    private async Task<int> ImportPersonasAsync(List<PersonaSeed> seeds, DateTimeOffset now, CancellationToken cancellationToken)
    {
        List<string> existingNames = await db.Personas.Select(persona => persona.Name).ToListAsync(cancellationToken);
        HashSet<string> existing = [.. existingNames];
        List<ChallengeArea> areas = await db.ChallengeAreas.ToListAsync(cancellationToken);
        List<PersonaSeed> added = [.. seeds.Where(seed => !existing.Contains(seed.Name))];

        foreach (PersonaSeed seed in added)
        {
            ChallengeArea area = areas.SingleOrDefault(candidate => candidate.Code == seed.ChallengeArea)
                ?? throw new InvalidOperationException($"Persona {seed.Name} points at unknown challenge area {seed.ChallengeArea}.");
            var persona = Persona.Import(seed.Name, seed.Age, seed.Description, seed.Goals, seed.Challenges, seed.Motivations, area, now);
            db.Personas.Add(persona);
        }

        await db.SaveChangesAsync(cancellationToken);
        return added.Count;
    }

    private async Task<int> UpsertMunicipalitiesAsync(List<MunicipalitySeed> seeds, DateTimeOffset now, CancellationToken cancellationToken)
    {
        Dictionary<string, Municipality> existing = await db.Municipalities.ToDictionaryAsync(municipality => municipality.Teryt, cancellationToken);

        foreach (MunicipalitySeed seed in seeds)
        {
            if (!NamedEnum.TryParse(seed.Type, out MunicipalityType type))
            {
                throw new InvalidOperationException($"Municipality {seed.Teryt} has unknown type {seed.Type}.");
            }

            if (existing.TryGetValue(seed.Teryt, out Municipality? municipality))
            {
                municipality.UpdateFromRegister(seed.Name, type, seed.Powiat, now);
            }
            else
            {
                var registered = Municipality.Register(seed.Teryt, seed.Name, type, seed.Powiat, now);
                db.Municipalities.Add(registered);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return seeds.Count;
    }

    private async Task<int> ImportInnovationsAsync(List<InnovationSeed> seeds, DateTimeOffset now, CancellationToken cancellationToken)
    {
        List<string> existingKeys = await db.Innovations
            .Where(innovation => innovation.SourceKey != null)
            .Select(innovation => innovation.SourceKey!)
            .ToListAsync(cancellationToken);
        HashSet<string> existing = [.. existingKeys];
        List<InnovationSeed> added = [.. seeds.Where(seed => !existing.Contains(seed.SourceKey))];

        foreach (InnovationSeed seed in added)
        {
            var sections = new InnovationCardSections(
                seed.Sections.Solution,
                seed.Sections.Problems,
                seed.Sections.TargetGroup,
                seed.Sections.Beneficiaries,
                seed.Sections.Evidence);
            var links = new InnovationLinks(seed.CardUrl, seed.VideoUrl, seed.MaterialsZipUrl, seed.CardPdfUrl, seed.TermsUrl);
            var innovation = Innovation.ImportFromLibrary(
                seed.SourceKey,
                seed.Title,
                seed.ShortDescription,
                seed.Categories,
                sections,
                seed.Organization,
                links,
                seed.Featured,
                seed.InServiceModel,
                now);
            db.Innovations.Add(innovation);
        }

        await db.SaveChangesAsync(cancellationToken);
        return added.Count;
    }

    private async Task<Dictionary<int, Indicator>> UpsertIndicatorsAsync(
        List<IndicatorSeed> seeds,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        Dictionary<int, Indicator> existing = await db.Indicators.ToDictionaryAsync(indicator => indicator.ObserverId, cancellationToken);

        foreach (IndicatorSeed seed in seeds)
        {
            if (!existing.TryGetValue(seed.Id, out Indicator? indicator))
            {
                indicator = Indicator.Register(seed.Id, now);
                db.Indicators.Add(indicator);
                existing.Add(seed.Id, indicator);
            }

            indicator.UpdateFromRegister(seed.Name, seed.Group, seed.Description, seed.Source, seed.Unit, seed.ChallengeAreas, seed.General, now);
        }

        await db.SaveChangesAsync(cancellationToken);
        return existing;
    }

    private async Task<int> UpsertIndicatorValuesAsync(
        List<IndicatorValueSeed> seeds,
        Dictionary<int, Indicator> indicatorsByObserverId,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        List<IndicatorValue> stored = await db.IndicatorValues.ToListAsync(cancellationToken);
        Dictionary<string, IndicatorValue> existing = stored.ToDictionary(value => ValueKey(value.IndicatorId, value.Level, value.TerritoryCode, value.Year));

        foreach (IndicatorValueSeed seed in seeds)
        {
            Indicator indicator = indicatorsByObserverId.GetValueOrDefault(seed.IndicatorId)
                ?? throw new InvalidOperationException($"Indicator value points at unknown indicator {seed.IndicatorId}.");

            if (!NamedEnum.TryParse(seed.Level, out StatisticsLevel level))
            {
                throw new InvalidOperationException($"Indicator value has unknown level {seed.Level}.");
            }

            var measure = new Measure(seed.Value);
            string key = ValueKey(indicator.Id, level, seed.Teryt, seed.Year);
            if (existing.TryGetValue(key, out IndicatorValue? value))
            {
                if (value.Value != measure)
                {
                    value.Correct(measure, now);
                }
            }
            else
            {
                var recorded = IndicatorValue.Record(indicator, level, seed.Teryt, seed.Year, measure, now);
                db.IndicatorValues.Add(recorded);
                existing.Add(key, recorded);
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return seeds.Count;
    }

    private static string ValueKey(Guid indicatorId, StatisticsLevel level, string territoryCode, int year)
    {
        return $"{indicatorId}|{level}|{territoryCode}|{year}";
    }
}
