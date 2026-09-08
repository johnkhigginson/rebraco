using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

public class Payment
{
    public int Id { get; set; }

    public int InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;

    public int TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    /// <summary>Amount in cents.</summary>
    public long AmountCents { get; set; }

    [Required, MaxLength(100)]
    public string StripePaymentIntentId { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? StripeChargeId { get; set; }

    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    [MaxLength(500)]
    public string? FailureReason { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public enum PaymentStatus
{
    Pending,
    Succeeded,
    Failed,
    Refunded,
}
