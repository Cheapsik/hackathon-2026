using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.Ideas;

/// <summary>"Pomysły" of the administrator's panel: decisions on submitted ideas and turning them into innovations.</summary>
[ApiController]
[Authorize(Roles = nameof(UserRole.ADMIN))]
[Route("admin/ideas")]
public sealed class AdminIdeasController(
    ListAdminIdeasHandler list,
    DecideIdeaHandler decide,
    ConvertIdeaToInnovationHandler convert) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<IdeaSummaryResponse>> Get([FromQuery] ListAdminIdeasRequest request, CancellationToken cancellationToken)
    {
        return list.HandleAsync(request, cancellationToken);
    }

    [HttpPost("{ideaId:guid}/decision")]
    public Task<IdeaResponse> Decide(Guid ideaId, [FromBody] DecideIdeaRequest request, CancellationToken cancellationToken)
    {
        return decide.HandleAsync(ideaId, request, cancellationToken);
    }

    [HttpPost("{ideaId:guid}/innovation")]
    [ProducesResponseType<IdeaResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<IdeaResponse>> Convert(Guid ideaId, CancellationToken cancellationToken)
    {
        IdeaResponse idea = await convert.HandleAsync(ideaId, cancellationToken);

        return Created($"/api/innovations/{idea.InnovationId}", idea);
    }
}
