using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.Municipalities;

[ApiController]
[AllowAnonymous]
[Route("municipalities")]
public sealed class MunicipalitiesController(ListMunicipalitiesHandler list) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<MunicipalityResponse>> Get(
        [FromQuery] ListMunicipalitiesRequest request,
        CancellationToken cancellationToken)
    {
        return list.HandleAsync(request, cancellationToken);
    }
}
