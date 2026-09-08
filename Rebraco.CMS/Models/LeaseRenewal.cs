using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Rebraco.CMS.Models;

public class LeaseRenewal
{
    public int Id { get; set; }

    public int OriginalLeaseId { get; set; }
    public Lease OriginalLease { get; set; } = null!;

    /// <summary>Set when the renewal is confirmed and a new lease is created.</summary>
    public int? NewLeaseId { get; set; }
    public Lease? NewLease { get; set; }

    public DateTime ProposedStartDate { get; set; }
    public DateTime ProposedEndDate { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal ProposedMonthlyRent { get; set; }

    public LeaseType ProposedLeaseType { get; set; } = LeaseType.Fixed;

    public RenewalStatus Status { get; set; } = RenewalStatus.Offered;

    [MaxLength(1000)]
    public string? ManagerNotes { get; set; }

    [MaxLength(1000)]
    public string? TenantNotes { get; set; }

    public DateTimeOffset OfferedAt { get; set; }
    public DateTimeOffset? TenantRespondedAt { get; set; }
    public DateTimeOffset? ConfirmedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
