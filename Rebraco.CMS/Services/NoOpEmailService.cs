using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

/// <summary>
/// Placeholder email service that logs instead of sending.
/// Replace with SMTP or SendGrid implementation when ready.
/// </summary>
public class NoOpEmailService : IEmailService
{
    private readonly ILogger<NoOpEmailService> _logger;

    public NoOpEmailService(ILogger<NoOpEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendInquiryNotificationAsync(Inquiry inquiry)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Inquiry notification for {Property} from {Name} <{Email}>",
            inquiry.PropertyName ?? "unknown property",
            inquiry.FullName,
            inquiry.Email);

        return Task.CompletedTask;
    }

    public Task SendTenantWelcomeAsync(Tenant tenant, string temporaryPassword)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Tenant welcome for {Name} <{Email}> (password: {Password})",
            $"{tenant.FirstName} {tenant.LastName}",
            tenant.Email,
            temporaryPassword);

        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string email, string firstName, string resetUrl)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Password reset for {Name} <{Email}> — URL: {Url}",
            firstName,
            email,
            resetUrl);

        return Task.CompletedTask;
    }

    // ── Transactional notifications ──────────────────────────────────────

    public Task SendInvoiceNotificationAsync(Invoice invoice, Tenant tenant)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Invoice notification to {Email} — {Description} ${Amount}",
            tenant.Email, invoice.Description, invoice.AmountCents / 100m);
        return Task.CompletedTask;
    }

    public Task SendPaymentConfirmationAsync(Invoice invoice, Tenant tenant)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Payment confirmation to {Email} — Invoice #{Id} ${Amount}",
            tenant.Email, invoice.Id, invoice.AmountCents / 100m);
        return Task.CompletedTask;
    }

    public Task SendInvoiceOverdueAsync(Invoice invoice, Tenant tenant)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Invoice overdue to {Email} — {Description} ${Amount} due {DueDate}",
            tenant.Email, invoice.Description, invoice.AmountCents / 100m, invoice.DueDate);
        return Task.CompletedTask;
    }

    public Task SendMaintenanceStatusUpdateAsync(MaintenanceRequest request, Tenant tenant,
        string oldStatus, string newStatus)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Maintenance update to {Email} — {Title} ({OldStatus} → {NewStatus})",
            tenant.Email, request.Title, oldStatus, newStatus);
        return Task.CompletedTask;
    }

    public Task SendMaintenanceSubmittedAsync(MaintenanceRequest request, Tenant tenant)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Maintenance submitted notification — {Title} by {Tenant}",
            request.Title, $"{tenant.FirstName} {tenant.LastName}");
        return Task.CompletedTask;
    }

    public Task SendLeaseExpiringAsync(Lease lease, Tenant tenant, int daysRemaining)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Lease expiring to {Email} — {Days} days remaining (ends {EndDate})",
            tenant.Email, daysRemaining, lease.EndDate.ToString("yyyy-MM-dd"));
        return Task.CompletedTask;
    }

    // ── Application notifications ─────────────────────────────────────

    public Task SendApplicationReceivedAsync(Application application)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Application received — #{Id} from {Name} <{Email}>",
            application.Id, $"{application.ApplicantFirstName} {application.ApplicantLastName}",
            application.ApplicantEmail);
        return Task.CompletedTask;
    }

    public Task SendApplicationStatusUpdateAsync(Application application, string oldStatus, string newStatus)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Application status update to {Email} — #{Id} ({OldStatus} → {NewStatus})",
            application.ApplicantEmail, application.Id, oldStatus, newStatus);
        return Task.CompletedTask;
    }

    public Task SendApplicationApprovedAsync(Application application)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Application approved — #{Id} to {Email}",
            application.Id, application.ApplicantEmail);
        return Task.CompletedTask;
    }

    public Task SendApplicationDeniedAsync(Application application, string reason)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Application denied — #{Id} to {Email}, reason: {Reason}",
            application.Id, application.ApplicantEmail, reason);
        return Task.CompletedTask;
    }

    // ── Lease renewal notifications ────────────────────────────────

    public Task SendRenewalOfferAsync(LeaseRenewal renewal, Tenant tenant)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Renewal offer to {Email} — Lease #{LeaseId}, ${Rent}/mo",
            tenant.Email, renewal.OriginalLeaseId, renewal.ProposedMonthlyRent);
        return Task.CompletedTask;
    }

    public Task SendRenewalResponseAsync(LeaseRenewal renewal, bool accepted)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Renewal response — Renewal #{Id} {Response}",
            renewal.Id, accepted ? "accepted" : "declined");
        return Task.CompletedTask;
    }

    public Task SendRenewalConfirmedAsync(LeaseRenewal renewal, Tenant tenant)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Renewal confirmed to {Email} — Renewal #{Id}, new Lease #{NewLeaseId}",
            tenant.Email, renewal.Id, renewal.NewLeaseId);
        return Task.CompletedTask;
    }

    public Task SendRenewalExpiringLeaseManagerAsync(Lease lease, int daysRemaining)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Expiring lease alert — Lease #{Id}, {Days} days remaining",
            lease.Id, daysRemaining);
        return Task.CompletedTask;
    }

    // ── Tour notifications ────────────────────────────────────────────

    public Task SendTourConfirmationAsync(Tour tour)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Tour confirmation to {Email} — {Date} {Start}-{End} at {Property}",
            tour.Email, tour.ScheduledDate.ToString("yyyy-MM-dd"), tour.StartTime, tour.EndTime,
            tour.Property?.Name ?? $"Property #{tour.PropertyId}");
        return Task.CompletedTask;
    }

    public Task SendTourRescheduledAsync(Tour tour)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Tour rescheduled to {Email} — {Date} {Start}-{End} at {Property}",
            tour.Email, tour.ScheduledDate.ToString("yyyy-MM-dd"), tour.StartTime, tour.EndTime,
            tour.Property?.Name ?? $"Property #{tour.PropertyId}");
        return Task.CompletedTask;
    }

    public Task SendTourCancelledAsync(Tour tour, string? reason)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Tour cancelled to {Email} — {Date} at {Property}, reason: {Reason}",
            tour.Email, tour.ScheduledDate.ToString("yyyy-MM-dd"),
            tour.Property?.Name ?? $"Property #{tour.PropertyId}", reason ?? "(none)");
        return Task.CompletedTask;
    }

    public Task SendTourReminderAsync(Tour tour)
    {
        _logger.LogInformation(
            "Rebraco: [NoOp Email] Tour reminder to {Email} — {Date} {Start}-{End} at {Property}",
            tour.Email, tour.ScheduledDate.ToString("yyyy-MM-dd"), tour.StartTime, tour.EndTime,
            tour.Property?.Name ?? $"Property #{tour.PropertyId}");
        return Task.CompletedTask;
    }
}
