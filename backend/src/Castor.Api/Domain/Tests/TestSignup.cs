namespace Castor.Api.Domain;

/// <summary>
/// "Chcę testować": a signed-in user with a tester profile joins the testing of one innovation or one idea that seeks
/// testers (SPEC 7 IV).
/// </summary>
public sealed class TestSignup
{
    private TestSignup()
    {
    }

    public Guid Id { get; private set; }

    public Guid UserId { get; private set; }

    public TestTargetKind TargetKind { get; private set; }

    public Guid? InnovationId { get; private set; }

    public Guid? IdeaId { get; private set; }

    public DateTimeOffset JoinedAt { get; private set; }

    public static TestSignup ForInnovation(User tester, Innovation innovation, DateTimeOffset joinedAt)
    {
        ArgumentNullException.ThrowIfNull(tester);
        ArgumentNullException.ThrowIfNull(innovation);

        EnsureProfile(tester);
        if (!innovation.SeeksTesters)
        {
            throw new DomainException("This innovation is not looking for testers.", StatusCodes.Status409Conflict);
        }

        return new TestSignup
        {
            Id = Guid.CreateVersion7(),
            UserId = tester.Id,
            TargetKind = TestTargetKind.INNOVATION,
            InnovationId = innovation.Id,
            JoinedAt = joinedAt,
        };
    }

    public static TestSignup ForIdea(User tester, Idea idea, DateTimeOffset joinedAt)
    {
        ArgumentNullException.ThrowIfNull(tester);
        ArgumentNullException.ThrowIfNull(idea);

        EnsureProfile(tester);
        if (!idea.SeeksTesters)
        {
            throw new DomainException("This idea is not looking for testers.", StatusCodes.Status409Conflict);
        }

        if (idea.Status is IdeaStatus.DRAFT or IdeaStatus.REJECTED)
        {
            throw new DomainException("This idea is not open for testers.", StatusCodes.Status409Conflict);
        }

        return new TestSignup
        {
            Id = Guid.CreateVersion7(),
            UserId = tester.Id,
            TargetKind = TestTargetKind.IDEA,
            IdeaId = idea.Id,
            JoinedAt = joinedAt,
        };
    }

    private static void EnsureProfile(User tester)
    {
        if (tester.TesterProfile is null)
        {
            throw new DomainException("Fill in the tester profile before signing up.");
        }
    }
}
