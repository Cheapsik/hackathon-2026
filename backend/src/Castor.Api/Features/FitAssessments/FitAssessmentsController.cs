using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Castor.Api.Features.FitAssessments;

/// <summary>
/// "Karta dopasowania do gminy" of an innovation. Generating a card and talking to its assistant need a session; a
/// generated card is open to everyone.
/// </summary>
[ApiController]
[Route("innovations/{innovationId:guid}/fit")]
public sealed class FitAssessmentsController(
    CreateFitAssessmentHandler create,
    FindFitAssessmentHandler find,
    GetFitAssessmentHandler get,
    RecalculateFitAssessmentHandler recalculate,
    AskFitAssistantHandler ask,
    ListFitAssistantMessagesHandler listMessages) : ControllerBase
{
    /// <summary>201 for a newly generated card, 200 for one already stored for this gmina and data year.</summary>
    [HttpPost]
    [EnableRateLimiting(RateLimitPolicies.PublicAi)]
    [ProducesResponseType<FitAssessmentResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<FitAssessmentResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<FitAssessmentResponse>> Post(
        Guid innovationId,
        [FromBody] CreateFitAssessmentRequest request,
        CancellationToken cancellationToken)
    {
        FitAssessmentOutcome outcome = await create.HandleAsync(innovationId, request, cancellationToken);
        if (!outcome.Created)
        {
            return Ok(outcome.Response);
        }

        return Created($"/api/innovations/{innovationId}/fit/{outcome.Response.Id}", outcome.Response);
    }

    [AllowAnonymous]
    [HttpGet]
    public Task<FitAssessmentResponse> Find(Guid innovationId, [FromQuery] string? teryt, CancellationToken cancellationToken)
    {
        return find.HandleAsync(innovationId, teryt, cancellationToken);
    }

    [AllowAnonymous]
    [HttpGet("{fitAssessmentId:guid}")]
    public Task<FitAssessmentResponse> GetById(Guid innovationId, Guid fitAssessmentId, CancellationToken cancellationToken)
    {
        return get.HandleAsync(innovationId, fitAssessmentId, cancellationToken);
    }

    [HttpPost("{fitAssessmentId:guid}/recalculate")]
    [Authorize(Roles = nameof(UserRole.ADMIN))]
    public Task<FitAssessmentResponse> Recalculate(Guid innovationId, Guid fitAssessmentId, CancellationToken cancellationToken)
    {
        return recalculate.HandleAsync(innovationId, fitAssessmentId, cancellationToken);
    }

    [HttpGet("{fitAssessmentId:guid}/assistant")]
    public Task<IReadOnlyList<FitAssistantMessageResponse>> Messages(
        Guid innovationId,
        Guid fitAssessmentId,
        CancellationToken cancellationToken)
    {
        return listMessages.HandleAsync(innovationId, fitAssessmentId, cancellationToken);
    }

    [HttpPost("{fitAssessmentId:guid}/assistant")]
    [EnableRateLimiting(RateLimitPolicies.PublicAi)]
    public Task<IReadOnlyList<FitAssistantMessageResponse>> Ask(
        Guid innovationId,
        Guid fitAssessmentId,
        [FromBody] AskFitAssistantRequest request,
        CancellationToken cancellationToken)
    {
        return ask.HandleAsync(innovationId, fitAssessmentId, request, cancellationToken);
    }
}
