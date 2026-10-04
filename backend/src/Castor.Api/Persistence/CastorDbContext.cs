using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Persistence;

/// <summary>The one context of the application, with every table of the model.</summary>
public sealed class CastorDbContext : DbContext
{
    public CastorDbContext(DbContextOptions<CastorDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<ChallengeArea> ChallengeAreas => Set<ChallengeArea>();

    public DbSet<Persona> Personas => Set<Persona>();

    public DbSet<Municipality> Municipalities => Set<Municipality>();

    public DbSet<Innovation> Innovations => Set<Innovation>();

    public DbSet<InnovationGenome> InnovationGenomes => Set<InnovationGenome>();

    public DbSet<ProblemReport> ProblemReports => Set<ProblemReport>();

    public DbSet<MatchResult> MatchResults => Set<MatchResult>();

    public DbSet<SimilarReportVerdict> SimilarReportVerdicts => Set<SimilarReportVerdict>();

    public DbSet<BackgroundJob> BackgroundJobs => Set<BackgroundJob>();

    public DbSet<Indicator> Indicators => Set<Indicator>();

    public DbSet<IndicatorValue> IndicatorValues => Set<IndicatorValue>();

    public DbSet<FitAssessment> FitAssessments => Set<FitAssessment>();

    public DbSet<FitAssistantMessage> FitAssistantMessages => Set<FitAssistantMessage>();

    public DbSet<GrantCall> GrantCalls => Set<GrantCall>();

    public DbSet<Conversation> Conversations => Set<Conversation>();

    public DbSet<Message> Messages => Set<Message>();

    public DbSet<Idea> Ideas => Set<Idea>();

    public DbSet<IdeaCoAuthor> IdeaCoAuthors => Set<IdeaCoAuthor>();

    public DbSet<IdeaReview> IdeaReviews => Set<IdeaReview>();

    public DbSet<IdeaAssistantMessage> IdeaAssistantMessages => Set<IdeaAssistantMessage>();

    public DbSet<GrantApplication> GrantApplications => Set<GrantApplication>();

    public DbSet<TestSignup> TestSignups => Set<TestSignup>();

    public DbSet<Feedback> Feedback => Set<Feedback>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        ModelConventions.ApplyTo(configurationBuilder);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // vector: embeddings of genomes and report chunks. unaccent and pg_trgm: Polish full-text search, for
        // which PostgreSQL ships no dictionary — the 'simple' configuration without diacritics plus trigram similarity.
        modelBuilder.HasPostgresExtension("vector");
        modelBuilder.HasPostgresExtension("unaccent");
        modelBuilder.HasPostgresExtension("pg_trgm");

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CastorDbContext).Assembly);
        ModelConventions.ApplyTo(modelBuilder);
    }
}
