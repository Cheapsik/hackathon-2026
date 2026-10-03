using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Castor.Api.Infrastructure;

/// <summary>Turns a refusal of the domain into a response; anything else stays a 500.</summary>
public sealed class DomainExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (context.Exception is not DomainException refusal)
        {
            return;
        }

        context.Result = new ObjectResult(new { error = refusal.Message })
        {
            StatusCode = refusal.StatusCode,
        };
        context.ExceptionHandled = true;
    }
}
