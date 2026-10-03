using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.InnovationGenomes;

/// <summary>Approving and correcting genomes (module VI, "Wiedza").</summary>
[ApiController]
[Authorize(Roles = nameof(UserRole.ADMIN))]
[Route("admin/genomes")]
public sealed class InnovationGenomesController(
    ListInnovationGenomesHandler list,
    GetInnovationGenomeHandler get,
    ReviseInnovationGenomeHandler revise,
    ApproveInnovationGenomeHandler approve,
    RecalculateInnovationGenomeHandler recalculate) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<InnovationGenomeResponse>> Get([FromQuery] ListInnovationGenomesRequest request, CancellationToken cancellationToken)
    {
        return list.HandleAsync(request, cancellationToken);
    }

    [HttpGet("{genomeId:guid}")]
    public Task<InnovationGenomeResponse> GetById(Guid genomeId, CancellationToken cancellationToken)
    {
        return get.HandleAsync(genomeId, cancellationToken);
    }

    [HttpPut("{genomeId:guid}")]
    public Task<InnovationGenomeResponse> Put(Guid genomeId, [FromBody] ReviseInnovationGenomeRequest request, CancellationToken cancellationToken)
    {
        return revise.HandleAsync(genomeId, request, cancellationToken);
    }

    [HttpPost("{genomeId:guid}/approve")]
    public Task<InnovationGenomeResponse> Approve(Guid genomeId, CancellationToken cancellationToken)
    {
        return approve.HandleAsync(genomeId, cancellationToken);
    }

    /// <summary>The genome is removed and generated again in the background.</summary>
    [HttpPost("{genomeId:guid}/recalculate")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> Recalculate(Guid genomeId, CancellationToken cancellationToken)
    {
        await recalculate.HandleAsync(genomeId, cancellationToken);

        return Accepted();
    }
}
