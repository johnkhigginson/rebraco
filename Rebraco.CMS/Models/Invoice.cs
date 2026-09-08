using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

public class Invoice
{
    public int Id { get; set; }

    public int LeaseId { get; set; }
    public Lease Lease { get; set; } = null!;

    public int TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    [Required, MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    /// <summary>Amount in cents (e.g. 125000 = $1,250.00). Stored in cents to match Stripe and avoid rounding.</summary>
    public long AmountCents { get; set; }

    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

    public DateOnly DueDate { get; set; }

    public DateTimeOffset? PaidAt { get; set; }

    [MaxLength(100)]
    public string? StripePaymentIntentId { get; set; }

    /// <summary>Set when an overdue notification email has been sent, to prevent duplicates.</summary>
    public DateTimeOffset? OverdueNotifiedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public enum InvoiceStatus
{
    Draft,
    Sent,
    Paid,
    Failed,
    Void,
    Overdue,
}
