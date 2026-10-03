using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.BackgroundJobs;

[ApiController]
[Authorize(Roles = nameof(UserRole.ADMIN))]
[Route("admin/jobs")]
public sealed class BackgroundJobsController(ListBackgroundJobsHandler list, QueueGenomeGenerationHandler queueGenomes) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<BackgroundJobResponse>> Get(CancellationToken cancellationToken)
    {
        return list.HandleAsync(cancellationToken);
    }

    [HttpPost("genomes")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> QueueGenomes(CancellationToken cancellationToken)
    {
        await queueGenomes.HandleAsync(cancellationToken);

        return Accepted();
    }
}
