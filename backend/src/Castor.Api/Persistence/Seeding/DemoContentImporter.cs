using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Persistence;

/// <summary>
/// Imports data/seed/demo_content.json when <c>Seed:DemoContent</c> is on, after the seed: demo accounts and what they
/// did — reports with their threads, ideas with reviews and testers, grant calls, questions to experts, partnerships
/// and ratings — so no screen of the demo starts empty. Everything goes through the domain's own factories, dated back
/// from the moment of the import, and is saved at once or not at all. Like the rest of the seed it is only added
/// (ADR 0003): when any demo account already exists, the import does nothing, so a restart neither duplicates the
/// content nor undoes what people did with it. No language model is asked: matching runs when a report is opened.
/// </summary>
public sealed class DemoContentImporter(
    CastorDbContext db,
    IPasswordHasher<User> passwords,
    IClock clock,
    ILogger<DemoContentImporter> logger)
{
    public const string FileName = "demo_content.json";

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task ImportAsync(string seedPath, string? password, CancellationToken cancellationToken)
    {
        PasswordPolicy.EnsureAcceptable(password);

        string path = Path.Combine(seedPath, FileName);
        DemoContentSeed content;
        await using (FileStream stream = File.OpenRead(path))
        {
            content = await JsonSerializer.DeserializeAsync<DemoContentSeed>(stream, Json, cancellationToken)
                ?? throw new InvalidOperationException($"Seed file {path} is empty.");
        }

        List<string> emails = [.. content.Accounts.Select(account => User.NormalizeEmail(account.Email)
            ?? throw new InvalidOperationException($"Demo account {account.Key} has an invalid e-mail address."))];
        if (await db.Users.AnyAsync(user => emails.Contains(user.Email), cancellationToken))
        {
            logger.LogInformation("Demo content is already imported; skipped.");
            return;
        }

        var import = new Import(db, clock.UtcNow, await db.ChallengeAreas.ToListAsync(cancellationToken));
        await import.AccountsAsync(content.Accounts, passwords, password!, cancellationToken);
        import.GrantCalls(content.GrantCalls);
        await import.ProblemReportsAsync(content.ProblemReports, cancellationToken);
        import.Ideas(content.Ideas);
        import.ExpertQuestions(content.ExpertQuestions);
        await import.PartnershipsAsync(content.Partnerships, cancellationToken);
        await import.FeedbackAsync(content.Feedback, cancellationToken);

        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "Demo content imported: {Accounts} accounts, {Reports} problem reports, {Ideas} ideas, {GrantCalls} grant calls, {Conversations} conversations, {Feedback} ratings.",
            content.Accounts.Count,
            content.ProblemReports.Count,
            content.Ideas.Count,
            content.GrantCalls.Count,
            content.ExpertQuestions.Count + content.Partnerships.Count,
            content.Feedback.Count);
    }

    /// <summary>One run of the import: the accounts it created, by key, and the moment everything is dated back from.</summary>
    private sealed class Import(CastorDbContext db, DateTimeOffset now, List<ChallengeArea> challengeAreas)
    {
        private readonly Dictionary<string, User> accounts = new(StringComparer.Ordinal);

        private readonly Dictionary<string, Municipality> municipalities = new(StringComparer.Ordinal);

        private readonly Dictionary<string, Innovation> innovations = new(StringComparer.Ordinal);

        public async Task AccountsAsync(
            List<DemoAccountSeed> seeds,
            IPasswordHasher<User> passwords,
            string password,
            CancellationToken cancellationToken)
        {
            foreach (DemoAccountSeed seed in seeds)
            {
                var user = User.Register(seed.Email, now);
                user.AssignPasswordHash(passwords.HashPassword(user, password), now);

                UserRole role = Parse<UserRole>(seed.Role, $"account {seed.Key}");
                Municipality? municipality = seed.MunicipalityTeryt is null
                    ? null
                    : await MunicipalityAsync(seed.MunicipalityTeryt, cancellationToken);
                user.AssignRole(role, municipality, Areas(seed.ChallengeAreas), now);

                if (seed.TesterProfile is DemoTesterProfileSeed profile)
                {
                    Municipality home = await MunicipalityAsync(profile.MunicipalityTeryt, cancellationToken);
                    user.SaveTesterProfile(profile.Age, home, profile.AccessibilityNeeds, profile.Equipment, now);
                }

                db.Users.Add(user);
                accounts.Add(seed.Key, user);
            }
        }

        public void GrantCalls(List<DemoGrantCallSeed> seeds)
        {
            DateOnly today = DateOnly.FromDateTime(now.UtcDateTime);
            foreach (DemoGrantCallSeed seed in seeds)
            {
                DateTimeOffset preparedAt = now.AddDays(Math.Min(seed.OpensInDays, 0) - 7);
                var grantCall = GrantCall.Draft(
                    seed.Title,
                    seed.Description,
                    seed.Criteria,
                    Areas(seed.ChallengeAreas),
                    today.AddDays(seed.OpensInDays),
                    today.AddDays(seed.ClosesInDays),
                    preparedAt);

                GrantCallStatus status = Parse<GrantCallStatus>(seed.Status, $"grant call {seed.Title}");
                if (status is GrantCallStatus.OPEN or GrantCallStatus.CLOSED)
                {
                    grantCall.Open(now.AddDays(Math.Min(seed.OpensInDays, 0)));
                }

                if (status == GrantCallStatus.CLOSED)
                {
                    grantCall.Close(now.AddDays(Math.Min(seed.ClosesInDays, 0)));
                }

                db.GrantCalls.Add(grantCall);
            }
        }

        public async Task ProblemReportsAsync(List<DemoProblemReportSeed> seeds, CancellationToken cancellationToken)
        {
            foreach (DemoProblemReportSeed seed in seeds)
            {
                DateTimeOffset submittedAt = DaysAgo(seed.DaysAgo);
                Municipality? municipality = seed.MunicipalityTeryt is null
                    ? null
                    : await MunicipalityAsync(seed.MunicipalityTeryt, cancellationToken);
                Guid? authorId = seed.Author is null ? null : Account(seed.Author).Id;

                var report = ProblemReport.Submit(
                    seed.Description,
                    municipality,
                    seed.SubmittedOnBehalf,
                    dictated: false,
                    keepOriginalDescription: false,
                    authorId,
                    TrackingCode.Generate(),
                    submittedAt);
                report.Classify(
                    Areas(seed.ChallengeAreas),
                    seed.RootCauses,
                    seed.TargetGroup,
                    Parse<ProblemReportUrgency>(seed.Urgency, "report urgency"),
                    seed.Keywords,
                    clarifyingQuestions: [],
                    submittedAt);

                var conversation = Conversation.ForProblemReport(report, submittedAt);
                foreach (DemoMessageSeed message in seed.Messages)
                {
                    Post(conversation, message, visitorWritesAsInitiator: true);
                }

                ProblemReportStatus status = Parse<ProblemReportStatus>(seed.Status, "report status");
                if (status != ProblemReportStatus.RECEIVED)
                {
                    DateTimeOffset movedAt = seed.Messages.Count > 0 ? DaysAgo(seed.Messages.Min(message => message.DaysAgo)) : submittedAt;
                    report.MoveByAdmin(status, movedAt);
                }

                db.ProblemReports.Add(report);
                db.Conversations.Add(conversation);
            }
        }

        public void Ideas(List<DemoIdeaSeed> seeds)
        {
            foreach (DemoIdeaSeed seed in seeds)
            {
                User author = Account(seed.Author);
                DateTimeOffset createdAt = DaysAgo(seed.DaysAgo);
                InnovationStage stage = Parse<InnovationStage>(seed.Stage, $"idea {seed.Title}");
                var canvas = new IdeaCanvas(
                    seed.Title,
                    seed.ProblemIntensity,
                    seed.ProblemFrequency,
                    seed.ProblemScale,
                    seed.Recipients,
                    null,
                    seed.Solution,
                    stage,
                    seed.Supporters,
                    seed.Opponents,
                    seed.EmotionalValues,
                    seed.FunctionalValues,
                    null);
                var idea = Idea.Draft(author.Id, canvas, Areas(seed.ChallengeAreas), null, createdAt);
                db.Ideas.Add(idea);

                IdeaStatus status = Parse<IdeaStatus>(seed.Status, $"idea {seed.Title}");
                if (status == IdeaStatus.DRAFT)
                {
                    continue;
                }

                // A day to submit, a day for the experts, a day for the decision.
                DateTimeOffset submittedAt = createdAt.AddDays(1);
                idea.RecordSimilarity([], submittedAt);
                idea.Submit(author.Id, submittedAt);

                foreach (DemoIdeaReviewSeed review in seed.Reviews)
                {
                    User expert = Account(review.Expert);
                    IdeaReviewRecommendation recommendation = Parse<IdeaReviewRecommendation>(review.Recommendation, $"review of {seed.Title}");
                    db.IdeaReviews.Add(IdeaReview.Write(idea, expert.Id, expert.ChallengeAreaCodes, recommendation, review.Comment, createdAt.AddDays(2)));
                }

                if (status is IdeaStatus.ACCEPTED or IdeaStatus.REJECTED)
                {
                    idea.Decide(status, createdAt.AddDays(3));
                }

                if (seed.SeeksTesters)
                {
                    idea.SetSeeksTesters(author.Id, true, createdAt.AddDays(3));
                }

                foreach (string tester in seed.Testers)
                {
                    db.TestSignups.Add(TestSignup.ForIdea(Account(tester), idea, DaysAgo(1)));
                }
            }
        }

        public void ExpertQuestions(List<DemoConversationSeed> seeds)
        {
            foreach (DemoConversationSeed seed in seeds)
            {
                string code = seed.ChallengeArea ?? throw new InvalidOperationException($"Expert question \"{seed.Subject}\" names no challenge area.");
                ChallengeArea area = Areas([code])[0];
                var conversation = Conversation.AskExperts(Account(seed.Initiator).Id, area, seed.Subject, DaysAgo(seed.DaysAgo));
                foreach (DemoMessageSeed message in seed.Messages)
                {
                    Post(conversation, message, visitorWritesAsInitiator: false);
                }

                db.Conversations.Add(conversation);
            }
        }

        public async Task PartnershipsAsync(List<DemoConversationSeed> seeds, CancellationToken cancellationToken)
        {
            foreach (DemoConversationSeed seed in seeds)
            {
                string sourceKey = seed.Innovation ?? throw new InvalidOperationException($"Partnership \"{seed.Subject}\" names no innovation.");
                Innovation innovation = await InnovationAsync(sourceKey, cancellationToken);
                var conversation = Conversation.ProposePartnership(Account(seed.Initiator).Id, innovation, seed.Subject, DaysAgo(seed.DaysAgo));
                foreach (DemoMessageSeed message in seed.Messages)
                {
                    Post(conversation, message, visitorWritesAsInitiator: false);
                }

                db.Conversations.Add(conversation);
            }
        }

        public async Task FeedbackAsync(List<DemoFeedbackSeed> seeds, CancellationToken cancellationToken)
        {
            foreach (DemoFeedbackSeed seed in seeds)
            {
                Innovation innovation = await InnovationAsync(seed.Innovation, cancellationToken);
                db.Feedback.Add(Feedback.Write(innovation, Account(seed.Author), seed.Stars, seed.WhatWorks, seed.WhatToImprove, false, DaysAgo(2)));
            }
        }

        /// <summary>An account writes on the side of its role; without a sender, the visitor holding the report's code.</summary>
        private void Post(Conversation conversation, DemoMessageSeed message, bool visitorWritesAsInitiator)
        {
            DateTimeOffset postedAt = DaysAgo(message.DaysAgo);
            if (message.Sender is null)
            {
                if (!visitorWritesAsInitiator)
                {
                    throw new InvalidOperationException("Only a report's thread has messages without a sender.");
                }

                db.Messages.Add(conversation.Post(SenderRole.INITIATOR, null, message.Text, postedAt));
                return;
            }

            User sender = Account(message.Sender);
            SenderRole role = sender.Role switch
            {
                UserRole.ADMIN => SenderRole.ADMIN,
                UserRole.EXPERT => SenderRole.EXPERT,
                _ => SenderRole.INITIATOR,
            };
            db.Messages.Add(conversation.Post(role, sender.Id, message.Text, postedAt));
        }

        private DateTimeOffset DaysAgo(int days)
        {
            return now.AddDays(-days);
        }

        private User Account(string key)
        {
            return accounts.GetValueOrDefault(key)
                ?? throw new InvalidOperationException($"Demo content refers to unknown account {key}.");
        }

        private List<ChallengeArea> Areas(IEnumerable<string> codes)
        {
            return [.. codes.Select(code => challengeAreas.SingleOrDefault(area => area.Code == code)
                ?? throw new InvalidOperationException($"Demo content refers to unknown challenge area {code}."))];
        }

        private async Task<Municipality> MunicipalityAsync(string teryt, CancellationToken cancellationToken)
        {
            if (!municipalities.TryGetValue(teryt, out Municipality? municipality))
            {
                municipality = await db.Municipalities.SingleOrDefaultAsync(candidate => candidate.Teryt == teryt, cancellationToken)
                    ?? throw new InvalidOperationException($"Demo content refers to unknown gmina {teryt}.");
                municipalities.Add(teryt, municipality);
            }

            return municipality;
        }

        private async Task<Innovation> InnovationAsync(string sourceKey, CancellationToken cancellationToken)
        {
            if (!innovations.TryGetValue(sourceKey, out Innovation? innovation))
            {
                innovation = await db.Innovations
                        .Include(candidate => candidate.SourceIdea)
                        .SingleOrDefaultAsync(candidate => candidate.SourceKey == sourceKey, cancellationToken)
                    ?? throw new InvalidOperationException($"Demo content refers to unknown innovation {sourceKey}.");
                innovations.Add(sourceKey, innovation);
            }

            return innovation;
        }

        private static TEnum Parse<TEnum>(string value, string what)
            where TEnum : struct, Enum
        {
            if (!NamedEnum.TryParse(value, out TEnum parsed))
            {
                throw new InvalidOperationException($"Demo content: {what} has unknown value {value}.");
            }

            return parsed;
        }
    }
}
