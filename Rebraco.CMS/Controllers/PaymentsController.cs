using Microsoft.AspNetCore.Mvc;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/payments")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPayments(
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 25)
    {
        var filter = new PaymentFilterDto
        {
            Status = Enum.TryParse<PaymentStatus>(status, true, out var s) ? s : null,
            Search = search,
            Skip = skip,
            Take = Math.Min(take, 100),
        };

        var (items, total) = await _paymentService.GetPaymentsAsync(filter);

        return Ok(new
        {
            items = items.Select(p => new
            {
                p.Id,
                p.AmountCents,
                Status = p.Status.ToString(),
                p.StripePaymentIntentId,
                p.FailureReason,
                p.CreatedAt,
                TenantName = $"{p.Tenant.FirstName} {p.Tenant.LastName}",
                InvoiceDescription = p.Invoice.Description,
                p.InvoiceId,
            }),
            total,
            skip,
            take,
        });
    }
}
