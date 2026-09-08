using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Rebraco.CMS.Models;

public class MaintenanceRequest
{
    public int Id { get; set; }

    public int UnitId { get; set; }
    public Unit Unit { get; set; } = null!;

    public int? TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? Description { get; set; }

    /// <summary>Where in the unit the issue is, e.g. "kitchen sink", "master bathroom".</summary>
    [MaxLength(200)]
    public string? LocationDetail { get; set; }

    /// <summary>Whether tenant grants permission for staff to enter the unit when absent.</summary>
    public bool PermissionToEnter { get; set; }

    /// <summary>Free-text preferred availability window for scheduling repairs.</summary>
    [MaxLength(500)]
    public string? PreferredAvailability { get; set; }

    /// <summary>Free-text urgency description beyond the Priority enum level.</summary>
    [MaxLength(500)]
    public string? UrgencyNotes { get; set; }

    public MaintenancePriority Priority { get; set; } = MaintenancePriority.Medium;
    public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Open;
    public MaintenanceCategory Category { get; set; } = MaintenanceCategory.Other;

    public DateTime? ScheduledDate { get; set; }
    public DateTime? CompletedDate { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? EstimatedCost { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? ActualCost { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation
    public ICollection<MaintenanceNote> Notes { get; set; } = new List<MaintenanceNote>();
    public ICollection<MaintenanceImage> Images { get; set; } = new List<MaintenanceImage>();
}
