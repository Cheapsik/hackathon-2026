namespace Castor.Api.Domain;

/// <summary>
/// Thrown when a request would leave the model in a state the product does not allow.
/// </summary>
public class DomainException : Exception
{
    public DomainException(string message, int statusCode = StatusCodes.Status400BadRequest)
        : base(message)
    {
        StatusCode = statusCode;
    }

    public int StatusCode { get; }
}
