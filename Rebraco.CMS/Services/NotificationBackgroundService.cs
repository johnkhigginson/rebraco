using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

/// <summary>
/// Background service that runs daily to:
/// 1. Auto-generate recurring rent invoices for active leases
/// 2. Mark overdue invoices and send notification emails
/// 3. Send lease-expiring warnings (30-day window)
/// </summary>
public class NotificationBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationBackgroundService> _logger;

    public NotificationBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<NotificationBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait a bit on startup to let the app fully initialize
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Rebraco: Notification background service starting daily run");

            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<RebracoDbContext>();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                await ProcessRecurringInvoicesAsync(db, emailService, stoppingToken);
                await ProcessOverdueInvoicesAsync(db, emailService, stoppingToken);
                await ProcessExpiringLeasesAsync(db, emailService, stoppingToken);
                await ProcessRenewalAutoDetectionAsync(db, emailService, stoppingToken);
                await ProcessExpiredRenewalOffersAsync(db, stoppingToken);
                await ProcessTourRemindersAsync(db, emailService, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Rebraco: Notification background service encountered an error");
            }

            _logger.LogInformation("Rebraco: Notification background service daily run complete");

            // Wait 24 hours before next run
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }

    private async Task ProcessRecurringInvoicesAsync(
        RebracoDbContext db, IEmailService emailService, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var dueLeases = await db.Leases
            .Include(l => l.Tenant)
            .Where(l => l.AutoInvoice
                        && l.Status == LeaseStatus.Active
                        && l.NextInvoiceDate != null
                        && l.NextInvoiceDate <= today)
            .ToListAsync(ct);

        if (dueLeases.Count == 0) return;

        _logger.LogInformation("Rebraco: Generating recurring invoices for {Count} leases", dueLeases.Count);

        foreach (var lease in dueLeases)
        {
            var invoiceDate = lease.NextInvoiceDate!.Value;
            var invoice = new Invoice
            {
                LeaseId = lease.Id,
                TenantId = lease.TenantId,
                Description = $"Monthly Rent — {invoiceDate.ToString("MMMM yyyy")}",
                AmountCents = (long)(lease.MonthlyRent * 100),
                Status = InvoiceStatus.Sent,
                DueDate = invoiceDate,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };

            db.Invoices.Add(invoice);

            // Advance NextInvoiceDate by one month, clamping for short months
            lease.NextInvoiceDate = LeaseService.AdvanceOneMonth(invoiceDate, lease.StartDate.Day);
            lease.UpdatedAt = DateTimeOffset.UtcNow;

            _logger.LogInformation(
                "Rebraco: Auto-generated Invoice for Lease #{LeaseId} — {Description} (${Amount})",
                lease.Id, invoice.Description, lease.MonthlyRent);

            try
            {
                await emailService.SendInvoiceNotificationAsync(invoice, lease.Tenant);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Rebraco: Failed to send auto-invoice email for Lease #{LeaseId}", lease.Id);
            }
        }

        await db.SaveChangesAsync(ct);

        _logger.LogInformation("Rebraco: Generated {Count} recurring invoices", dueLeases.Count);
    }

    private async Task ProcessOverdueInvoicesAsync(
        RebracoDbContext db, IEmailService emailService, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var overdueInvoices = await db.Invoices
            .Include(i => i.Tenant)
            .Where(i => i.Status == InvoiceStatus.Sent
                        && i.DueDate < today
                        && i.OverdueNotifiedAt == null)
            .ToListAsync(ct);

        if (overdueInvoices.Count == 0) return;

        _logger.LogInformation("Rebraco: Found {Count} overdue invoices to process", overdueInvoices.Count);

        foreach (var invoice in overdueInvoices)
        {
            invoice.Status = InvoiceStatus.Overdue;
            invoice.OverdueNotifiedAt = DateTimeOffset.UtcNow;
            invoice.UpdatedAt = DateTimeOffset.UtcNow;

            try
            {
                await emailService.SendInvoiceOverdueAsync(invoice, invoice.Tenant);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Rebraco: Failed to send overdue email for Invoice #{InvoiceId}", invoice.Id);
            }
        }

        await db.SaveChangesAsync(ct);

        _logger.LogInformation("Rebraco: Marked {Count} invoices as overdue", overdueInvoices.Count);
    }

    private async Task ProcessExpiringLeasesAsync(
        RebracoDbContext db, IEmailService emailService, CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var thirtyDaysOut = today.AddDays(30);

        var expiringLeases = await db.Leases
            .Include(l => l.Tenant)
            .Include(l => l.Unit)
            .Where(l => l.Status == LeaseStatus.Active
                        && l.EndDate > today
                        && l.EndDate <= thirtyDaysOut
                        && l.ExpiryNotifiedAt == null)
            .ToListAsync(ct);

        if (expiringLeases.Count == 0) return;

        _logger.LogInformation("Rebraco: Found {Count} expiring leases to notify", expiringLeases.Count);

        foreach (var lease in expiringLeases)
        {
            var daysRemaining = (int)(lease.EndDate.Date - today).TotalDays;

            lease.ExpiryNotifiedAt = DateTimeOffset.UtcNow;
            lease.UpdatedAt = DateTimeOffset.UtcNow;

            try
            {
                await emailService.SendLeaseExpiringAsync(lease, lease.Tenant, daysRemaining);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Rebraco: Failed to send lease expiry email for Lease #{LeaseId}", lease.Id);
            }
        }

        await db.SaveChangesAsync(ct);

        _logger.LogInformation("Rebraco: Sent {Count} lease expiry notifications", expiringLeases.Count);
    }

    private async Task ProcessRenewalAutoDetectionAsync(
        RebracoDbContext db, IEmailService emailService, CancellationToken ct)
    {
        // Read configurable window from AppSettings (default: 60 days)
        var autoDetectSetting = await db.AppSettings.FindAsync("renewal:autoDetectDays");
        var autoDetectDays = int.TryParse(autoDetectSetting?.Value, out var ad) ? ad : 60;

        var today = DateTime.UtcNow.Date;
        var cutoff = today.AddDays(autoDetectDays);

        var expiringLeases = await db.Leases
            .Include(l => l.Tenant)
            .Include(l => l.Unit)
            .Where(l => l.Status == LeaseStatus.Active
                        && l.EndDate > today
                        && l.EndDate <= cutoff
                        && l.RenewalNotifiedAt == null
                        && !db.LeaseRenewals.Any(r =>
                            r.OriginalLeaseId == l.Id &&
                            (r.Status == RenewalStatus.Offered || r.Status == RenewalStatus.TenantAccepted)))
            .ToListAsync(ct);

        if (expiringLeases.Count == 0) return;

        _logger.LogInformation("Rebraco: Found {Count} leases expiring without renewal offers", expiringLeases.Count);

        foreach (var lease in expiringLeases)
        {
            var daysRemaining = (int)(lease.EndDate.Date - today).TotalDays;

            lease.RenewalNotifiedAt = DateTimeOffset.UtcNow;
            lease.UpdatedAt = DateTimeOffset.UtcNow;

            try
            {
                await emailService.SendRenewalExpiringLeaseManagerAsync(lease, daysRemaining);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Rebraco: Failed to send renewal expiring alert for Lease #{LeaseId}", lease.Id);
            }
        }

        await db.SaveChangesAsync(ct);

        _logger.LogInformation("Rebraco: Sent {Count} renewal expiring lease alerts", expiringLeases.Count);
    }

    private async Task ProcessExpiredRenewalOffersAsync(
        RebracoDbContext db, CancellationToken ct)
    {
        // Read configurable offer expiry window from AppSettings (default: 30 days)
        var offerExpirySetting = await db.AppSettings.FindAsync("renewal:offerExpiryDays");
        var offerExpiryDays = int.TryParse(offerExpirySetting?.Value, out var oe) ? oe : 30;

        var cutoff = DateTimeOffset.UtcNow.AddDays(-offerExpiryDays);

        var staleOffers = await db.LeaseRenewals
            .Where(r => r.Status == RenewalStatus.Offered && r.OfferedAt < cutoff)
            .ToListAsync(ct);

        if (staleOffers.Count == 0) return;

        foreach (var offer in staleOffers)
        {
            offer.Status = RenewalStatus.Expired;
            offer.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);

        _logger.LogInformation("Rebraco: Expired {Count} stale renewal offers", staleOffers.Count);
    }

    private async Task ProcessTourRemindersAsync(
        RebracoDbContext db, IEmailService emailService, CancellationToken ct)
    {
        // Check if reminders are enabled
        var reminderSetting = await db.AppSettings.FindAsync("tour:reminderEnabled");
        var reminderEnabled = !bool.TryParse(reminderSetting?.Value, out var re) || re; // default true
        if (!reminderEnabled) return;

        var tomorrow = DateTime.UtcNow.Date.AddDays(1);

        var upcomingTours = await db.Tours
            .Include(t => t.Property)
            .Include(t => t.Unit)
            .Where(t => t.Status == TourStatus.Confirmed
                        && t.ScheduledDate == tomorrow
                        && t.ReminderSentAt == null)
            .ToListAsync(ct);

        if (upcomingTours.Count == 0) return;

        _logger.LogInformation("Rebraco: Sending {Count} tour reminders for tomorrow", upcomingTours.Count);

        foreach (var tour in upcomingTours)
        {
            tour.ReminderSentAt = DateTimeOffset.UtcNow;
            tour.UpdatedAt = DateTimeOffset.UtcNow;

            try
            {
                await emailService.SendTourReminderAsync(tour);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Rebraco: Failed to send tour reminder for Tour #{TourId}", tour.Id);
            }
        }

        await db.SaveChangesAsync(ct);

        _logger.LogInformation("Rebraco: Sent {Count} tour reminders", upcomingTours.Count);
    }
}
