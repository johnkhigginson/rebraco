using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;
using StripeClient = Stripe.StripeClient;
using CustomerCreateOptions = Stripe.CustomerCreateOptions;
using CustomerService = Stripe.CustomerService;
using PaymentIntentCreateOptions = Stripe.PaymentIntentCreateOptions;
using PaymentIntentAutomaticPaymentMethodsOptions = Stripe.PaymentIntentAutomaticPaymentMethodsOptions;
using PaymentIntentService = Stripe.PaymentIntentService;
using RequestOptions = Stripe.RequestOptions;
using EventTypes = Stripe.EventTypes;
using PaymentIntent = Stripe.PaymentIntent;

namespace Rebraco.CMS.Services;

public class PaymentService : IPaymentService
{
    private readonly RebracoDbContext _db;
    private readonly IStripeConfigService _stripeConfig;
    private readonly IEmailService _emailService;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(
        RebracoDbContext db,
        IStripeConfigService stripeConfig,
        IEmailService emailService,
        ILogger<PaymentService> logger)
    {
        _db = db;
        _stripeConfig = stripeConfig;
        _emailService = emailService;
        _logger = logger;
    }

    // ─── Invoice CRUD ────────────────────────────────────────────

    public async Task<Invoice> CreateInvoiceAsync(CreateInvoiceDto dto)
    {
        var invoice = new Invoice
        {
            LeaseId = dto.LeaseId,
            TenantId = dto.TenantId,
            Description = dto.Description,
            AmountCents = dto.AmountCents,
            DueDate = dto.DueDate,
            Status = InvoiceStatus.Draft,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Rebraco: Invoice #{InvoiceId} created for Tenant #{TenantId}, Lease #{LeaseId}, Amount: {Amount}",
            invoice.Id, dto.TenantId, dto.LeaseId, dto.AmountCents);

        return invoice;
    }

    public async Task<Invoice?> SendInvoiceAsync(int invoiceId)
    {
        var invoice = await _db.Invoices.FindAsync(invoiceId);
        if (invoice == null || invoice.Status != InvoiceStatus.Draft)
            return null;

        invoice.Status = InvoiceStatus.Sent;
        invoice.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Invoice #{InvoiceId} sent to tenant", invoiceId);

        // Send notification email (non-blocking — failure must not roll back the status change)
        try
        {
            await _db.Entry(invoice).Reference(i => i.Tenant).LoadAsync();
            await _emailService.SendInvoiceNotificationAsync(invoice, invoice.Tenant);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Rebraco: Failed to send invoice notification email for Invoice #{InvoiceId}", invoiceId);
        }

        return invoice;
    }

    public async Task<Invoice?> VoidInvoiceAsync(int invoiceId)
    {
        var invoice = await _db.Invoices.FindAsync(invoiceId);
        if (invoice == null || invoice.Status is InvoiceStatus.Paid or InvoiceStatus.Void)
            return null;

        invoice.Status = InvoiceStatus.Void;
        invoice.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Invoice #{InvoiceId} voided", invoiceId);
        return invoice;
    }

    public async Task<(List<Invoice> Items, int Total)> GetInvoicesAsync(InvoiceFilterDto filter)
    {
        var query = _db.Invoices
            .AsNoTracking()
            .Include(i => i.Tenant)
            .Include(i => i.Lease)
            .AsQueryable();

        if (filter.Status.HasValue)
            query = query.Where(i => i.Status == filter.Status.Value);
        if (filter.TenantId.HasValue)
            query = query.Where(i => i.TenantId == filter.TenantId.Value);
        if (filter.LeaseId.HasValue)
            query = query.Where(i => i.LeaseId == filter.LeaseId.Value);
        if (!string.IsNullOrWhiteSpace(filter.Search))
            query = query.Where(i =>
                i.Description.Contains(filter.Search) ||
                i.Tenant.FirstName.Contains(filter.Search) ||
                i.Tenant.LastName.Contains(filter.Search));

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip(filter.Skip)
            .Take(Math.Min(filter.Take, 100))
            .ToListAsync();

        return (items, total);
    }

    public async Task<Invoice?> GetInvoiceByIdAsync(int id)
    {
        return await _db.Invoices
            .AsNoTracking()
            .Include(i => i.Tenant)
            .Include(i => i.Lease)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    // ─── Tenant-scoped ───────────────────────────────────────────

    public async Task<List<Invoice>> GetTenantInvoicesAsync(int tenantId)
    {
        return await _db.Invoices
            .AsNoTracking()
            .Include(i => i.Lease)
            .Where(i => i.TenantId == tenantId &&
                        i.Status != InvoiceStatus.Draft) // Tenants don't see drafts
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }

    public async Task<Invoice?> GetTenantInvoiceByIdAsync(int invoiceId, int tenantId)
    {
        return await _db.Invoices
            .AsNoTracking()
            .Include(i => i.Lease)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == invoiceId &&
                                      i.TenantId == tenantId &&
                                      i.Status != InvoiceStatus.Draft);
    }

    // ─── Stripe PaymentIntent ────────────────────────────────────

    public async Task<PaymentIntentResult> CreatePaymentIntentAsync(int invoiceId, int tenantId)
    {
        var invoice = await _db.Invoices
            .Include(i => i.Tenant)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && i.TenantId == tenantId);

        if (invoice == null)
            throw new InvalidOperationException("Invoice not found.");
        if (invoice.Status is not (InvoiceStatus.Sent or InvoiceStatus.Overdue))
            throw new InvalidOperationException("Invoice is not in a payable state.");

        var mode = await _stripeConfig.GetModeAsync();
        if (mode == StripeMode.NotConfigured)
            throw new InvalidOperationException("Payment processing is not configured.");

        var secretKey = await _stripeConfig.GetSecretKeyAsync();
        var publishableKey = await _stripeConfig.GetPublishableKeyAsync();
        var connectedAccountId = await _stripeConfig.GetConnectedAccountIdAsync();

        if (string.IsNullOrEmpty(secretKey) || string.IsNullOrEmpty(publishableKey))
            throw new InvalidOperationException("Stripe keys are not configured.");

        // Ensure tenant has a Stripe Customer
        var tenant = invoice.Tenant;
        var client = new StripeClient(secretKey);

        if (string.IsNullOrEmpty(tenant.StripeCustomerId))
        {
            var customerOptions = new CustomerCreateOptions
            {
                Email = tenant.Email,
                Name = $"{tenant.FirstName} {tenant.LastName}",
                Metadata = new Dictionary<string, string>
                {
                    ["rebraco_tenant_id"] = tenant.Id.ToString(),
                },
            };

            // In Connect mode, create customer on the connected account
            var requestOptions = mode == StripeMode.Connect && !string.IsNullOrEmpty(connectedAccountId)
                ? new RequestOptions { StripeAccount = connectedAccountId }
                : null;

            var customerService = new CustomerService(client);
            var customer = await customerService.CreateAsync(customerOptions, requestOptions);

            tenant.StripeCustomerId = customer.Id;
            await _db.SaveChangesAsync();
        }

        // Create PaymentIntent
        var piOptions = new PaymentIntentCreateOptions
        {
            Amount = invoice.AmountCents,
            Currency = "usd",
            Customer = tenant.StripeCustomerId,
            Metadata = new Dictionary<string, string>
            {
                ["rebraco_invoice_id"] = invoice.Id.ToString(),
                ["rebraco_tenant_id"] = tenant.Id.ToString(),
            },
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
            {
                Enabled = true,
            },
        };

        RequestOptions? piRequestOptions = null;

        if (mode == StripeMode.Connect && !string.IsNullOrEmpty(connectedAccountId))
        {
            piRequestOptions = new RequestOptions { StripeAccount = connectedAccountId };
        }

        var piService = new PaymentIntentService(client);
        var paymentIntent = await piService.CreateAsync(piOptions, piRequestOptions);

        // Update invoice with PaymentIntent ID
        invoice.StripePaymentIntentId = paymentIntent.Id;
        invoice.UpdatedAt = DateTimeOffset.UtcNow;

        // Create Payment record
        var payment = new Models.Payment
        {
            InvoiceId = invoice.Id,
            TenantId = tenantId,
            AmountCents = invoice.AmountCents,
            StripePaymentIntentId = paymentIntent.Id,
            Status = PaymentStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        _db.Payments.Add(payment);

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Rebraco: PaymentIntent {PaymentIntentId} created for Invoice #{InvoiceId} ({Mode} mode)",
            paymentIntent.Id, invoice.Id, mode);

        return new PaymentIntentResult(
            paymentIntent.ClientSecret,
            publishableKey,
            mode == StripeMode.Connect ? connectedAccountId : null);
    }

    // ─── Webhook Handling ────────────────────────────────────────

    public async Task HandleWebhookAsync(Stripe.Event stripeEvent)
    {
        _logger.LogInformation(
            "Rebraco: Processing Stripe webhook event {EventType} ({EventId})",
            stripeEvent.Type, stripeEvent.Id);

        switch (stripeEvent.Type)
        {
            case EventTypes.PaymentIntentSucceeded:
                await HandlePaymentSucceededAsync(stripeEvent);
                break;

            case EventTypes.PaymentIntentPaymentFailed:
                await HandlePaymentFailedAsync(stripeEvent);
                break;

            default:
                _logger.LogDebug("Rebraco: Ignoring unhandled webhook event type {EventType}", stripeEvent.Type);
                break;
        }
    }

    private async Task HandlePaymentSucceededAsync(Stripe.Event stripeEvent)
    {
        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
        if (paymentIntent == null) return;

        var payment = await _db.Payments
            .Include(p => p.Invoice)
            .FirstOrDefaultAsync(p => p.StripePaymentIntentId == paymentIntent.Id);

        if (payment == null)
        {
            _logger.LogWarning("Rebraco: No payment record found for PaymentIntent {Id}", paymentIntent.Id);
            return;
        }

        // Idempotent: skip if already processed
        if (payment.Status == PaymentStatus.Succeeded) return;

        payment.Status = PaymentStatus.Succeeded;
        payment.StripeChargeId = paymentIntent.LatestChargeId;

        payment.Invoice.Status = InvoiceStatus.Paid;
        payment.Invoice.PaidAt = DateTimeOffset.UtcNow;
        payment.Invoice.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Rebraco: Payment succeeded for Invoice #{InvoiceId} (PaymentIntent {PaymentIntentId})",
            payment.InvoiceId, paymentIntent.Id);

        // Send payment confirmation email
        try
        {
            await _db.Entry(payment.Invoice).Reference(i => i.Tenant).LoadAsync();
            await _emailService.SendPaymentConfirmationAsync(payment.Invoice, payment.Invoice.Tenant);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Rebraco: Failed to send payment confirmation email for Invoice #{InvoiceId}", payment.InvoiceId);
        }
    }

    private async Task HandlePaymentFailedAsync(Stripe.Event stripeEvent)
    {
        var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
        if (paymentIntent == null) return;

        var payment = await _db.Payments
            .Include(p => p.Invoice)
            .FirstOrDefaultAsync(p => p.StripePaymentIntentId == paymentIntent.Id);

        if (payment == null) return;
        if (payment.Status == PaymentStatus.Succeeded) return; // Don't overwrite success

        payment.Status = PaymentStatus.Failed;
        payment.FailureReason = paymentIntent.LastPaymentError?.Message ?? "Payment failed";

        payment.Invoice.Status = InvoiceStatus.Failed;
        payment.Invoice.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogWarning(
            "Rebraco: Payment failed for Invoice #{InvoiceId}: {Reason}",
            payment.InvoiceId, payment.FailureReason);
    }

    // ─── Payment History ─────────────────────────────────────────

    public async Task<(List<Models.Payment> Items, int Total)> GetPaymentsAsync(PaymentFilterDto filter)
    {
        var query = _db.Payments
            .AsNoTracking()
            .Include(p => p.Tenant)
            .Include(p => p.Invoice)
            .AsQueryable();

        if (filter.Status.HasValue)
            query = query.Where(p => p.Status == filter.Status.Value);
        if (filter.TenantId.HasValue)
            query = query.Where(p => p.TenantId == filter.TenantId.Value);
        if (!string.IsNullOrWhiteSpace(filter.Search))
            query = query.Where(p =>
                p.Invoice.Description.Contains(filter.Search) ||
                p.Tenant.FirstName.Contains(filter.Search) ||
                p.Tenant.LastName.Contains(filter.Search));

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip(filter.Skip)
            .Take(Math.Min(filter.Take, 100))
            .ToListAsync();

        return (items, total);
    }

    public async Task<List<Models.Payment>> GetTenantPaymentsAsync(int tenantId)
    {
        return await _db.Payments
            .AsNoTracking()
            .Include(p => p.Invoice)
            .Where(p => p.TenantId == tenantId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }
}
