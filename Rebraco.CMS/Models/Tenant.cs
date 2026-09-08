using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

public class Tenant
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required, MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Phone { get; set; }

    [MaxLength(150)]
    public string? EmergencyContactName { get; set; }

    [MaxLength(30)]
    public string? EmergencyContactPhone { get; set; }

    public DateTime? MoveInDate { get; set; }

    /// <summary>
    /// Links this tenant to their Umbraco member account for portal login.
    /// Set when inquiry is converted to tenant.
    /// </summary>
    public Guid? MemberKey { get; set; }

    /// <summary>Stripe Customer ID for payment processing.</summary>
    [MaxLength(100)]
    public string? StripeCustomerId { get; set; }

    public TenantStatus Status { get; set; } = TenantStatus.Active;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation
    public ICollection<Lease> Leases { get; set; } = new List<Lease>();
    public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; } = new List<MaintenanceRequest>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
