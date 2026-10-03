using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.ProblemReports;

/// <summary>"Skrzynka zgłoszeń" of the administrator's panel (module VI).</summary>
[ApiController]
[Authorize(Roles = nameof(UserRole.ADMIN))]
[Route("admin/problem-reports")]
public sealed class InboxProblemReportsController(
    ListInboxProblemReportsHandler list,
    GetInboxProblemReportHandler get,
    DraftProblemReportReplyHandler draftReply,
    SaveProblemReportReplyDraftHandler saveReplyDraft,
    SendProblemReportReplyHandler sendReply,
    MoveProblemReportHandler move) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<InboxProblemReportSummaryResponse>> Get(
        [FromQuery] ListInboxProblemReportsRequest request,
        CancellationToken cancellationToken)
    {
        return list.HandleAsync(request, cancellationToken);
    }

    [HttpGet("{problemReportId:guid}")]
    public Task<InboxProblemReportResponse> GetById(Guid problemReportId, CancellationToken cancellationToken)
    {
        return get.HandleAsync(problemReportId, cancellationToken);
    }

    [HttpPost("{problemReportId:guid}/reply-draft")]
    public Task<InboxProblemReportResponse> DraftReply(Guid problemReportId, CancellationToken cancellationToken)
    {
        return draftReply.HandleAsync(problemReportId, cancellationToken);
    }

    [HttpPut("{problemReportId:guid}/reply-draft")]
    public Task<InboxProblemReportResponse> SaveReplyDraft(
        Guid problemReportId,
        [FromBody] SaveProblemReportReplyDraftRequest request,
        CancellationToken cancellationToken)
    {
        return saveReplyDraft.HandleAsync(problemReportId, request, cancellationToken);
    }

    [HttpPost("{problemReportId:guid}/reply-draft/send")]
    public Task<InboxProblemReportResponse> SendReply(Guid problemReportId, CancellationToken cancellationToken)
    {
        return sendReply.HandleAsync(problemReportId, cancellationToken);
    }

    [HttpPost("{problemReportId:guid}/move")]
    public Task<InboxProblemReportResponse> Move(
        Guid problemReportId,
        [FromBody] MoveProblemReportRequest request,
        CancellationToken cancellationToken)
    {
        return move.HandleAsync(problemReportId, request, cancellationToken);
    }
}
