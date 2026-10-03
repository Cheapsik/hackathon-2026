using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace Castor.Api.Infrastructure;

/// <summary>
/// Puts every controller route under <c>/api</c>, so the path the browser calls, the one nginx proxies and the one
/// in the OpenAPI document are the same. A controller declares only its resource: <c>[Route("bookings")]</c>.
/// </summary>
public sealed class ApiRoutePrefixConvention : IApplicationModelConvention
{
    public const string Prefix = "api";

    private static readonly AttributeRouteModel PrefixRoute = new(new RouteAttribute(Prefix));

    public void Apply(ApplicationModel application)
    {
        ArgumentNullException.ThrowIfNull(application);

        foreach (ControllerModel controller in application.Controllers)
        {
            foreach (SelectorModel selector in controller.Selectors)
            {
                if (selector.AttributeRouteModel is null)
                {
                    selector.AttributeRouteModel = PrefixRoute;
                    continue;
                }

                AttributeRouteModel? prefixed =
                    AttributeRouteModel.CombineAttributeRouteModel(PrefixRoute, selector.AttributeRouteModel);
                selector.AttributeRouteModel = prefixed;
            }
        }
    }
}
