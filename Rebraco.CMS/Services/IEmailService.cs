using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

public interface IEmailService
{
    Task SendInquiryNotificationAsync(Inquiry inquiry);
    Task SendTenantWelcomeAsync(Tenant tenant, string temporaryPassword);
    Task SendPasswordResetAsync(string email, string firstName, string resetUrl);

    // ── Transactional notifications ──────────────────────────────────────

    /// <summary>Notify tenant that an invoice has been sent (amount, due date).</summary>
    Task SendInvoiceNotificationAsync(Invoice invoice, Tenant tenant);

    /// <summary>Confirm payment received for an invoice.</summary>
    Task SendPaymentConfirmationAsync(Invoice invoice, Tenant tenant);

    /// <summary>Alert tenant that an invoice is past due.</summary>
    Task SendInvoiceOverdueAsync(Invoice invoice, Tenant tenant);

    /// <summary>Notify tenant of a maintenance request status change.</summary>
    Task SendMaintenanceStatusUpdateAsync(MaintenanceRequest request, Tenant tenant, string oldStatus, string newStatus);

    /// <summary>Notify manager that a tenant has submitted a new maintenance request.</summary>
    Task SendMaintenanceSubmittedAsync(MaintenanceRequest request, Tenant tenant);

    /// <summary>Warn tenant their lease is expiring within the given number of days.</summary>
    Task SendLeaseExpiringAsync(Lease lease, Tenant tenant, int daysRemaining);

    // ── Application notifications ─────────────────────────────────────

    /// <summary>Notify manager that a new application has been submitted.</summary>
    Task SendApplicationReceivedAsync(Application application);

    /// <summary>Notify prospect of a status change (e.g. Submitted → UnderReview).</summary>
    Task SendApplicationStatusUpdateAsync(Application application, string oldStatus, string newStatus);

    /// <summary>Notify prospect that their application has been approved.</summary>
    Task SendApplicationApprovedAsync(Application application);

    /// <summary>Notify prospect that their application has been denied.</summary>
    Task SendApplicationDeniedAsync(Application application, string reason);

    // ── Lease renewal notifications ────────────────────────────────

    /// <summary>Notify tenant that a renewal offer has been created for their lease.</summary>
    Task SendRenewalOfferAsync(LeaseRenewal renewal, Tenant tenant);

    /// <summary>Notify manager that a tenant has accepted or declined a renewal offer.</summary>
    Task SendRenewalResponseAsync(LeaseRenewal renewal, bool accepted);

    /// <summary>Notify tenant that their lease renewal has been confirmed.</summary>
    Task SendRenewalConfirmedAsync(LeaseRenewal renewal, Tenant tenant);

    /// <summary>Notify manager that a lease is expiring and no renewal offer has been created.</summary>
    Task SendRenewalExpiringLeaseManagerAsync(Lease lease, int daysRemaining);

    // ── Tour notifications ────────────────────────────────────────────

    /// <summary>Notify prospect that their tour has been confirmed.</summary>
    Task SendTourConfirmationAsync(Tour tour);

    /// <summary>Notify prospect that their tour has been rescheduled to a new date/time.</summary>
    Task SendTourRescheduledAsync(Tour tour);

    /// <summary>Notify prospect that their tour has been cancelled.</summary>
    Task SendTourCancelledAsync(Tour tour, string? reason);

    /// <summary>Send day-before reminder for an upcoming confirmed tour.</summary>
    Task SendTourReminderAsync(Tour tour);
}
