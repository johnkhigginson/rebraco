using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/invoices")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class InvoicesController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public InvoicesController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetInvoices(
        [FromQuery] string? status,
        [FromQuery] int? tenantId,
        [FromQuery] int? leaseId,
        [FromQuery] string? search,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 25)
    {
        var filter = new InvoiceFilterDto
        {
            Status = Enum.TryParse<InvoiceStatus>(status, true, out var s) ? s : null,
            TenantId = tenantId,
            LeaseId = leaseId,
            Search = search,
            Skip = skip,
            Take = Math.Min(take, 100),
        };

        var (items, total) = await _paymentService.GetInvoicesAsync(filter);

        return Ok(new
        {
            items = items.Select(i => new
            {
                i.Id,
                i.Description,
                i.AmountCents,
                Status = i.Status.ToString(),
                i.DueDate,
                i.PaidAt,
                i.CreatedAt,
                TenantName = $"{i.Tenant.FirstName} {i.Tenant.LastName}",
                i.TenantId,
                i.LeaseId,
            }),
            total,
            skip,
            take,
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetInvoice(int id)
    {
        var invoice = await _paymentService.GetInvoiceByIdAsync(id);
        if (invoice == null) return NotFound();

        return Ok(new
        {
            invoice.Id,
            invoice.Description,
            invoice.AmountCents,
            Status = invoice.Status.ToString(),
            invoice.DueDate,
            invoice.PaidAt,
            invoice.CreatedAt,
            invoice.StripePaymentIntentId,
            TenantName = $"{invoice.Tenant.FirstName} {invoice.Tenant.LastName}",
            invoice.TenantId,
            invoice.LeaseId,
            Payments = invoice.Payments.Select(p => new
            {
                p.Id,
                p.AmountCents,
                Status = p.Status.ToString(),
                p.StripePaymentIntentId,
                p.FailureReason,
                p.CreatedAt,
            }),
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var invoice = await _paymentService.CreateInvoiceAsync(new CreateInvoiceDto(
            request.LeaseId,
            request.TenantId,
            request.Description,
            request.AmountCents,
            request.DueDate));

        return Ok(new { id = invoice.Id });
    }

    [HttpPatch("{id:int}/send")]
    public async Task<IActionResult> SendInvoice(int id)
    {
        var invoice = await _paymentService.SendInvoiceAsync(id);
        if (invoice == null)
            return BadRequest(new { error = "Invoice not found or cannot be sent." });

        return Ok(new { success = true });
    }

    [HttpPatch("{id:int}/void")]
    public async Task<IActionResult> VoidInvoice(int id)
    {
        var invoice = await _paymentService.VoidInvoiceAsync(id);
        if (invoice == null)
            return BadRequest(new { error = "Invoice not found or cannot be voided." });

        return Ok(new { success = true });
    }
}

public class CreateInvoiceRequest
{
    [Required]
    public int LeaseId { get; set; }

    [Required]
    public int TenantId { get; set; }

    [Required, MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required, Range(1, long.MaxValue)]
    public long AmountCents { get; set; }

    [Required]
    public DateOnly DueDate { get; set; }
}
