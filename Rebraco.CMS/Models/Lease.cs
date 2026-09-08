using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Rebraco.CMS.Models;

public class Lease
{
    public int Id { get; set; }

    public int UnitId { get; set; }
    public Unit Unit { get; set; } = null!;

    public int TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    /// <summary>Optional bed/room designation within the unit (e.g. "Bed A", "Room 2").</summary>
    [MaxLength(50)]
    public string? BedDesignation { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal MonthlyRent { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? SecurityDeposit { get; set; }

    public LeaseStatus Status { get; set; } = LeaseStatus.Pending;
    public LeaseType LeaseType { get; set; } = LeaseType.Fixed;

    /// <summary>When true, the system auto-generates a monthly rent invoice for this lease.</summary>
    public bool AutoInvoice { get; set; }

    /// <summary>The next date an auto-invoice should be generated. Advanced by one month after each run.</summary>
    public DateOnly? NextInvoiceDate { get; set; }

    /// <summary>Set when a lease-expiring notification email has been sent, to prevent duplicates.</summary>
    public DateTimeOffset? ExpiryNotifiedAt { get; set; }

    /// <summary>Set when the manager was notified that this lease needs a renewal offer.</summary>
    public DateTimeOffset? RenewalNotifiedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<LeaseDocument> Documents { get; set; } = new List<LeaseDocument>();
}
