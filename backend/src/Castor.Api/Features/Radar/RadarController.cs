using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.Radar;

/// <summary>Trends and aggregates of needs are for administrators only (brief, SPEC 5).</summary>
[ApiController]
[Authorize(Roles = nameof(UserRole.ADMIN))]
[Route("admin/radar")]
public sealed class RadarController(GetRadarHandler get) : ControllerBase
{
    [HttpGet]
    public Task<RadarResponse> Get([FromQuery] GetRadarRequest request, CancellationToken cancellationToken)
    {
        return get.HandleAsync(request, cancellationToken);
    }
}
