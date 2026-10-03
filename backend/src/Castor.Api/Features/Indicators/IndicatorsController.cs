using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.Indicators;

/// <summary>Obserwator indicators and their values per gmina, for the Atlas map and the area pages.</summary>
[ApiController]
[AllowAnonymous]
[Route("indicators")]
public sealed class IndicatorsController(ListIndicatorsHandler list, GetIndicatorValuesHandler values) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<IndicatorSummaryResponse>> Get([FromQuery] ListIndicatorsRequest request, CancellationToken cancellationToken)
    {
        return list.HandleAsync(request, cancellationToken);
    }

    [HttpGet("{indicatorId:guid}/values")]
    public Task<IndicatorValuesResponse> Values(Guid indicatorId, CancellationToken cancellationToken)
    {
        return values.HandleAsync(indicatorId, cancellationToken);
    }
}
