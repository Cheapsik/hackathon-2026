using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.ChallengeAreas;

[ApiController]
[AllowAnonymous]
[Route("challenge-areas")]
public sealed class ChallengeAreasController(ListChallengeAreasHandler list, GetChallengeAreaHandler get) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<ChallengeAreaResponse>> Get(CancellationToken cancellationToken)
    {
        return list.HandleAsync(cancellationToken);
    }

    [HttpGet("{code}")]
    public Task<ChallengeAreaDetailsResponse> GetByCode(string code, CancellationToken cancellationToken)
    {
        return get.HandleAsync(code, cancellationToken);
    }
}
