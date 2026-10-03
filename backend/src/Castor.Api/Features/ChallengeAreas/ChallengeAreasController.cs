using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.ChallengeAreas;

[ApiController]
[AllowAnonymous]
[Route("challenge-areas")]
public sealed class ChallengeAreasController(ListChallengeAreasHandler list) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<ChallengeAreaResponse>> Get(CancellationToken cancellationToken)
    {
        return list.HandleAsync(cancellationToken);
    }
}
