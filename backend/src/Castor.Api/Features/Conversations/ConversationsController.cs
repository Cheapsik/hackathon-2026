using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.Conversations;

/// <summary>
/// Conversations (module V). A report's thread is open to a visitor without an account who presents the report's
/// tracking code in the <see cref="TrackingCodeHeader"/> header; listing and starting conversations need a session.
/// </summary>
[ApiController]
[Route("conversations")]
public sealed class ConversationsController(
    ListConversationsHandler list,
    GetConversationHandler get,
    PostMessageHandler postMessage,
    CreateExpertQuestionHandler createExpertQuestion,
    CreatePartnershipHandler createPartnership) : ControllerBase
{
    /// <summary>The same header that opens the report itself.</summary>
    public const string TrackingCodeHeader = "X-Tracking-Code";

    [HttpGet]
    public Task<IReadOnlyList<ConversationSummaryResponse>> Get(CancellationToken cancellationToken)
    {
        return list.HandleAsync(cancellationToken);
    }

    [AllowAnonymous]
    [HttpGet("{conversationId:guid}")]
    public Task<ConversationResponse> GetById(
        Guid conversationId,
        [FromHeader(Name = TrackingCodeHeader)] string? trackingCode,
        CancellationToken cancellationToken)
    {
        return get.HandleAsync(conversationId, trackingCode, cancellationToken);
    }

    [AllowAnonymous]
    [HttpPost("{conversationId:guid}/messages")]
    public Task<ConversationResponse> PostMessage(
        Guid conversationId,
        [FromHeader(Name = TrackingCodeHeader)] string? trackingCode,
        [FromBody] PostMessageRequest request,
        CancellationToken cancellationToken)
    {
        return postMessage.HandleAsync(conversationId, trackingCode, request, cancellationToken);
    }

    [HttpPost("expert-questions")]
    [ProducesResponseType<ConversationResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<ConversationResponse>> PostExpertQuestion(
        [FromBody] CreateExpertQuestionRequest request,
        CancellationToken cancellationToken)
    {
        ConversationResponse conversation = await createExpertQuestion.HandleAsync(request, cancellationToken);

        return Created($"/api/conversations/{conversation.Id}", conversation);
    }

    [HttpPost("partnerships")]
    [ProducesResponseType<ConversationResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<ConversationResponse>> PostPartnership(
        [FromBody] CreatePartnershipRequest request,
        CancellationToken cancellationToken)
    {
        ConversationResponse conversation = await createPartnership.HandleAsync(request, cancellationToken);

        return Created($"/api/conversations/{conversation.Id}", conversation);
    }
}
