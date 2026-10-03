namespace Castor.Api.Features.ProblemReports;

/// <param name="Answers">Answers in the order of the questions; an empty list skips them, a blank answer skips one.</param>
public sealed record AnswerProblemReportQuestionsRequest(
    IReadOnlyList<string?>? Answers);
