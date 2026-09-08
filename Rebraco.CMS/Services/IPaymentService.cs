using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

public record CreateInvoiceDto(
    int LeaseId,
    int TenantId,
    string Description,
    long AmountCents,
    DateOnly DueDate);

public record InvoiceFilterDto
{
    public InvoiceStatus? Status { get; init; }
    public int? TenantId { get; init; }
    public int? LeaseId { get; init; }
    public string? Search { get; init; }
    public int Skip { get; init; } = 0;
    public int Take { get; init; } = 25;
}

public record PaymentFilterDto
{
    public PaymentStatus? Status { get; init; }
    public int? TenantId { get; init; }
    public string? Search { get; init; }
    public int Skip { get; init; } = 0;
    public int Take { get; init; } = 25;
}

public record PaymentIntentResult(string ClientSecret, string PublishableKey, string? ConnectedAccountId);

public interface IPaymentService
{
    Task<Invoice> CreateInvoiceAsync(CreateInvoiceDto dto);
    Task<Invoice?> SendInvoiceAsync(int invoiceId);
    Task<Invoice?> VoidInvoiceAsync(int invoiceId);
    Task<(List<Invoice> Items, int Total)> GetInvoicesAsync(InvoiceFilterDto filter);
    Task<Invoice?> GetInvoiceByIdAsync(int id);

    /// <summary>Get invoices visible to a specific tenant (Sent, Paid, Failed only).</summary>
    Task<List<Invoice>> GetTenantInvoicesAsync(int tenantId);
    Task<Invoice?> GetTenantInvoiceByIdAsync(int invoiceId, int tenantId);

    /// <summary>Creates a Stripe PaymentIntent for the invoice and returns the client secret.</summary>
    Task<PaymentIntentResult> CreatePaymentIntentAsync(int invoiceId, int tenantId);

    /// <summary>Handles incoming Stripe webhook events.</summary>
    Task HandleWebhookAsync(Stripe.Event stripeEvent);

    Task<(List<Payment> Items, int Total)> GetPaymentsAsync(PaymentFilterDto filter);
    Task<List<Payment>> GetTenantPaymentsAsync(int tenantId);
}
