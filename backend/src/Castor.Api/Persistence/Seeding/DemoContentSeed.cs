namespace Castor.Api.Persistence;

/// <summary>
/// data/seed/demo_content.json: made-up accounts and what they did, so every module of the demo shows something.
/// People are referred to by <see cref="DemoAccountSeed.Key"/>, innovations by their source key.
/// </summary>
public sealed record DemoContentSeed(
    List<DemoAccountSeed> Accounts,
    List<DemoGrantCallSeed> GrantCalls,
    List<DemoProblemReportSeed> ProblemReports,
    List<DemoIdeaSeed> Ideas,
    List<DemoConversationSeed> ExpertQuestions,
    List<DemoConversationSeed> Partnerships,
    List<DemoFeedbackSeed> Feedback);
