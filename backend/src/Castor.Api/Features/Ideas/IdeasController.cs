using Castor.Api.Features.Conversations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Castor.Api.Features.Ideas;

/// <summary>
/// The Kreator of ideas (module III). The Canvas choices are open to everyone; writing, reading and reviewing ideas
/// need a session.
/// </summary>
[ApiController]
[Route("ideas")]
public sealed class IdeasController(
    GetIdeaCanvasHandler getCanvas,
    ListMyIdeasHandler listMine,
    ListSubmittedIdeasHandler listSubmitted,
    ListIdeasForReviewHandler listForReview,
    CreateIdeaHandler create,
    CreateIdeaFromHybridHandler createFromHybrid,
    GetIdeaHandler get,
    ReviseIdeaHandler revise,
    SubmitIdeaHandler submit,
    CheckIdeaSimilarityHandler checkSimilarity,
    JoinIdeaHandler join,
    ListIdeaAssistantMessagesHandler listAssistantMessages,
    AskIdeaAssistantHandler askAssistant,
    ReviewIdeaHandler review) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("canvas")]
    public IdeaCanvasResponse Canvas()
    {
        return getCanvas.Handle();
    }

    /// <summary>The ideas the signed-in user wrote or joined.</summary>
    [HttpGet]
    public Task<IReadOnlyList<IdeaSummaryResponse>> Get(CancellationToken cancellationToken)
    {
        return listMine.HandleAsync(cancellationToken);
    }

    [HttpGet("submitted")]
    public Task<IReadOnlyList<IdeaSummaryResponse>> Submitted(CancellationToken cancellationToken)
    {
        return listSubmitted.HandleAsync(cancellationToken);
    }

    [HttpGet("for-review")]
    [Authorize(Roles = nameof(UserRole.EXPERT))]
    public Task<IReadOnlyList<IdeaSummaryResponse>> ForReview(CancellationToken cancellationToken)
    {
        return listForReview.HandleAsync(cancellationToken);
    }

    [HttpPost]
    [ProducesResponseType<IdeaResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<IdeaResponse>> Post([FromBody] CreateIdeaRequest request, CancellationToken cancellationToken)
    {
        IdeaResponse idea = await create.HandleAsync(request, cancellationToken);

        return Created($"/api/ideas/{idea.Id}", idea);
    }

    /// <summary>"Rozwiń w Kreatorze": a visitor's report needs its tracking code in the header.</summary>
    [HttpPost("from-hybrid")]
    [ProducesResponseType<IdeaResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<IdeaResponse>> PostFromHybrid(
        [FromBody] CreateIdeaFromHybridRequest request,
        [FromHeader(Name = ConversationsController.TrackingCodeHeader)] string? trackingCode,
        CancellationToken cancellationToken)
    {
        IdeaResponse idea = await createFromHybrid.HandleAsync(request, trackingCode, cancellationToken);

        return Created($"/api/ideas/{idea.Id}", idea);
    }

    [HttpGet("{ideaId:guid}")]
    public Task<IdeaResponse> GetById(Guid ideaId, CancellationToken cancellationToken)
    {
        return get.HandleAsync(ideaId, cancellationToken);
    }

    [HttpPut("{ideaId:guid}")]
    public Task<IdeaResponse> Put(Guid ideaId, [FromBody] ReviseIdeaRequest request, CancellationToken cancellationToken)
    {
        return revise.HandleAsync(ideaId, request, cancellationToken);
    }

    /// <summary>Runs the duplicate check first unless it already read the card as it is.</summary>
    [HttpPost("{ideaId:guid}/submit")]
    [EnableRateLimiting(RateLimitPolicies.PublicAi)]
    public Task<IdeaResponse> Submit(Guid ideaId, CancellationToken cancellationToken)
    {
        return submit.HandleAsync(ideaId, cancellationToken);
    }

    [HttpPost("{ideaId:guid}/similar")]
    [EnableRateLimiting(RateLimitPolicies.PublicAi)]
    public Task<IdeaResponse> CheckSimilarity(Guid ideaId, CancellationToken cancellationToken)
    {
        return checkSimilarity.HandleAsync(ideaId, cancellationToken);
    }

    [HttpPost("{ideaId:guid}/join")]
    public Task<IdeaResponse> Join(Guid ideaId, CancellationToken cancellationToken)
    {
        return join.HandleAsync(ideaId, cancellationToken);
    }

    [HttpGet("{ideaId:guid}/assistant")]
    public Task<IReadOnlyList<IdeaAssistantMessageResponse>> AssistantMessages(Guid ideaId, CancellationToken cancellationToken)
    {
        return listAssistantMessages.HandleAsync(ideaId, cancellationToken);
    }

    [HttpPost("{ideaId:guid}/assistant")]
    [EnableRateLimiting(RateLimitPolicies.PublicAi)]
    public Task<IReadOnlyList<IdeaAssistantMessageResponse>> AskAssistant(
        Guid ideaId,
        [FromBody] AskIdeaAssistantRequest request,
        CancellationToken cancellationToken)
    {
        return askAssistant.HandleAsync(ideaId, request, cancellationToken);
    }

    [HttpPut("{ideaId:guid}/review")]
    [Authorize(Roles = nameof(UserRole.EXPERT))]
    public Task<IdeaResponse> Review(Guid ideaId, [FromBody] ReviewIdeaRequest request, CancellationToken cancellationToken)
    {
        return review.HandleAsync(ideaId, request, cancellationToken);
    }
}
