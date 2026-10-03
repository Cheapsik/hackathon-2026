using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.TesterProfile;

/// <summary>The tester profile filled once and reused on every "Chcę testować" (SPEC 7 IV).</summary>
[ApiController]
[Route("me/tester-profile")]
public sealed class TesterProfileController(GetTesterProfileHandler get, SaveTesterProfileHandler save) : ControllerBase
{
    [HttpGet]
    public Task<TesterProfileResponse> Get(CancellationToken cancellationToken)
    {
        return get.HandleAsync(cancellationToken);
    }

    [HttpPut]
    public Task<TesterProfileResponse> Put([FromBody] SaveTesterProfileRequest request, CancellationToken cancellationToken)
    {
        return save.HandleAsync(request, cancellationToken);
    }
}
