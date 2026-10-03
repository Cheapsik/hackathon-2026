using Microsoft.EntityFrameworkCore;

namespace Castor.Api.Features.Tests;

public sealed class CreateTestSignupHandler(CastorDbContext db, CurrentUser currentUser, IClock clock)
{
    public async Task<TestSignupResponse> HandleAsync(Guid targetId, CreateTestSignupRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!NamedEnum.TryParse(request.Kind, out TestTargetKind kind))
        {
            throw new DomainException("Kind is INNOVATION or IDEA.");
        }

        User tester = await db.Users.SingleAsync(candidate => candidate.Id == currentUser.UserId, cancellationToken);
        DateTimeOffset now = clock.UtcNow;
        TestSignup signup;

        if (kind == TestTargetKind.INNOVATION)
        {
            Innovation innovation = await db.Innovations.SingleOrDefaultAsync(candidate => candidate.Id == targetId, cancellationToken)
                ?? throw new DomainException("The innovation does not exist.", StatusCodes.Status404NotFound);
            signup = TestSignup.ForInnovation(tester, innovation, now);
        }
        else
        {
            Idea idea = await db.Ideas.Include(candidate => candidate.CoAuthors)
                    .SingleOrDefaultAsync(candidate => candidate.Id == targetId, cancellationToken)
                ?? throw new DomainException("The idea does not exist.", StatusCodes.Status404NotFound);
            signup = TestSignup.ForIdea(tester, idea, now);
        }

        db.TestSignups.Add(signup);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (PostgresErrors.IsUniqueViolation(exception))
        {
            throw new DomainException("You already signed up for this test.", StatusCodes.Status409Conflict);
        }

        return new TestSignupResponse(signup.Id, targetId, kind.ToString(), signup.JoinedAt);
    }
}
