using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

/// <summary>
/// Per-user notification preferences. Each row represents a notification type
/// the user has opted OUT of. If no row exists, the notification is enabled by default.
/// </summary>
public class NotificationPreference
{
    public int Id { get; set; }

    /// <summary>Umbraco member key (works for both managers and tenants).</summary>
    public Guid MemberKey { get; set; }

    /// <summary>
    /// The notification type key, e.g. "inquiry_new", "tour_requested", "invoice_sent",
    /// "payment_confirmation", "maintenance_update", "lease_expiring", "renewal_offer", etc.
    /// </summary>
    [Required, MaxLength(50)]
    public string NotificationType { get; set; } = string.Empty;

    /// <summary>Whether email notifications are enabled for this type.</summary>
    public bool EmailEnabled { get; set; } = true;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
