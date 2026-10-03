using Microsoft.AspNetCore.Mvc;

namespace Castor.Api.Features.Tests;

/// <summary>Poletko: who is looking for testers, and signing up (SPEC 7 IV).</summary>
[ApiController]
[Route("tests")]
public sealed class TestsController(ListTestsHandler list, CreateTestSignupHandler signup) : ControllerBase
{
    [HttpGet]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public Task<IReadOnlyList<TestOpportunityResponse>> Get(CancellationToken cancellationToken)
    {
        return list.HandleAsync(cancellationToken);
    }

    [HttpPost("{targetId:guid}/signups")]
    [ProducesResponseType<TestSignupResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<TestSignupResponse>> PostSignup(
        Guid targetId,
        [FromBody] CreateTestSignupRequest request,
        CancellationToken cancellationToken)
    {
        TestSignupResponse created = await signup.HandleAsync(targetId, request, cancellationToken);
        return Created($"/api/tests/{targetId}/signups/{created.Id}", created);
    }
}
