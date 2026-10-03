using Castor.Api.Features.PlainText;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Castor.Api.Features.ChallengeAreas;

/// <summary>Plain-language rewrites of the eight areas. Visitors see a text only after it is approved.</summary>
[ApiController]
[Authorize(Roles = nameof(UserRole.ADMIN))]
[Route("admin/challenge-areas")]
public sealed class AdminChallengeAreasController(
    GetChallengeAreaPlainTextHandler get,
    GenerateChallengeAreaPlainTextHandler generate,
    ReviseChallengeAreaPlainTextHandler revise,
    ApproveChallengeAreaPlainTextHandler approve) : ControllerBase
{
    [HttpGet("{code}/plain-text")]
    public Task<PlainTextResponse> GetPlainText(string code, CancellationToken cancellationToken)
    {
        return get.HandleAsync(code, cancellationToken);
    }

    [HttpPost("{code}/plain-text")]
    [EnableRateLimiting(RateLimitPolicies.PublicAi)]
    public Task<PlainTextResponse> Generate(string code, CancellationToken cancellationToken)
    {
        return generate.HandleAsync(code, cancellationToken);
    }

    [HttpPut("{code}/plain-text")]
    public Task<PlainTextResponse> Put(string code, [FromBody] RevisePlainTextRequest request, CancellationToken cancellationToken)
    {
        return revise.HandleAsync(code, request, cancellationToken);
    }

    [HttpPost("{code}/plain-text/approve")]
    public Task<PlainTextResponse> Approve(string code, CancellationToken cancellationToken)
    {
        return approve.HandleAsync(code, cancellationToken);
    }
}
