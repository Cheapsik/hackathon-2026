using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Infrastructure;

/// <summary>
/// Live updates in the app — the platform sends no e-mail, SMS or push. A signed-in connection joins its user's
/// group, an administrator also the administrators' group and an expert the groups of their challenge areas. Anyone,
/// with an account or without, may follow one problem report by its tracking code: the code works like a password.
/// </summary>
public sealed class LiveHub(CastorDbContext db, ExpertChallengeAreasQuery expertAreasQuery) : Hub
{
    public const string Path = "/hubs/live";

    public const string AdminsGroup = "admins";

    public static string UserGroup(Guid userId)
    {
        return $"user:{userId}";
    }

    public static string ExpertsGroup(string challengeAreaCode)
    {
        return $"experts:{challengeAreaCode}";
    }

    /// <param name="trackingCode">Normalized, without the dash.</param>
    public static string ProblemReportGroup(string trackingCode)
    {
        return $"report:{trackingCode}";
    }

    /// <summary>Everyone who may see the report: administrators, its author, its code holders and experts of its areas.</summary>
    public static IReadOnlyList<string> ProblemReportGroups(ProblemReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        List<string> groups = [AdminsGroup, ProblemReportGroup(report.TrackingCode)];
        if (report.AuthorId is Guid authorId)
        {
            groups.Add(UserGroup(authorId));
        }

        groups.AddRange(report.ChallengeAreaCodes.Select(ExpertsGroup));
        return groups;
    }

    /// <summary>
    /// Everyone who takes part in the conversation. Needs <see cref="Conversation.ProblemReport"/>, or for a partnership
    /// the innovation's source idea with its co-authors, loaded.
    /// </summary>
    public static IReadOnlyList<string> ConversationGroups(Conversation conversation)
    {
        ArgumentNullException.ThrowIfNull(conversation);

        if (conversation.ProblemReport is not null)
        {
            return ProblemReportGroups(conversation.ProblemReport);
        }

        List<string> groups = [AdminsGroup];
        if (conversation.InitiatorId is Guid initiatorId)
        {
            groups.Add(UserGroup(initiatorId));
        }

        IReadOnlyList<Guid> team = conversation.TeamUserIds();
        groups.AddRange(team.Select(UserGroup));
        IReadOnlyList<string> areas = conversation.ExpertAreaCodes();
        groups.AddRange(areas.Select(ExpertsGroup));
        return groups;
    }

    public override async Task OnConnectedAsync()
    {
        ClaimsPrincipal? principal = Context.User;
        string? userIdText = principal?.FindFirstValue(ClaimTypes.NameIdentifier);

        if (Guid.TryParse(userIdText, out Guid userId))
        {
            string userGroup = UserGroup(userId);
            await Groups.AddToGroupAsync(Context.ConnectionId, userGroup);

            string[] expertAreas = await expertAreasQuery.OfAsync(userId, Context.ConnectionAborted);
            foreach (string area in expertAreas)
            {
                string expertsGroup = ExpertsGroup(area);
                await Groups.AddToGroupAsync(Context.ConnectionId, expertsGroup);
            }
        }

        if (principal?.IsInRole(nameof(UserRole.ADMIN)) == true)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, AdminsGroup);
        }

        await base.OnConnectedAsync();
    }

    /// <summary>Follows one report's status and thread. An unknown code joins nothing and says nothing.</summary>
    public async Task FollowProblemReport(string? trackingCode)
    {
        string? normalized = TrackingCode.Normalize(trackingCode);
        if (normalized is null)
        {
            return;
        }

        bool exists = await db.ProblemReports.AnyAsync(report => report.TrackingCode == normalized, Context.ConnectionAborted);
        if (!exists)
        {
            return;
        }

        string reportGroup = ProblemReportGroup(normalized);
        await Groups.AddToGroupAsync(Context.ConnectionId, reportGroup);
    }
}
