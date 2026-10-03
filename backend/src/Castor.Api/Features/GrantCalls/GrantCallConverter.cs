namespace Castor.Api.Features.GrantCalls;

internal static class GrantCallConverter
{
    public static GrantCallResponse ToResponse(this GrantCall grantCall)
    {
        string status = grantCall.Status.ToString();

        return new GrantCallResponse(
            grantCall.Id,
            grantCall.Title,
            grantCall.Description,
            grantCall.Criteria,
            grantCall.ChallengeAreaCodes,
            grantCall.OpensOn,
            grantCall.ClosesOn,
            status,
            grantCall.IsOpen,
            grantCall.UpdatedAt);
    }
}
