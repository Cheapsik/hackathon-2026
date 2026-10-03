using Castor.Api.Features.PlainText;
using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Innovations;

/// <summary>Asks the model for a plain-language draft of the card. It stays a draft until an administrator approves it.</summary>
public sealed class GenerateInnovationPlainTextHandler(CastorDbContext db, PlainTextWriter writer, IClock clock)
{
    public async Task<PlainTextResponse> HandleAsync(Guid innovationId, CancellationToken cancellationToken)
    {
        Innovation innovation = await db.Innovations.SingleOrDefaultAsync(candidate => candidate.Id == innovationId, cancellationToken)
            ?? throw new DomainException("The innovation does not exist.", StatusCodes.Status404NotFound);

        string source = innovation.DescribeForPlainText();
        if (source.Length == 0)
        {
            throw new DomainException("The innovation card has no text to rewrite.");
        }

        string rewritten = await writer.RewriteAsync(innovation.Title, source, cancellationToken);
        innovation.RecordPlainText(rewritten, clock.UtcNow);
        await db.SaveChangesAsync(cancellationToken);

        return GetInnovationPlainTextHandler.ToResponse(innovation);
    }
}
