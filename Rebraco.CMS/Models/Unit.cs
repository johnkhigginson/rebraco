using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Rebraco.CMS.Models;

public class Unit
{
    public int Id { get; set; }

    public int PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    [Required, MaxLength(50)]
    public string UnitNumber { get; set; } = string.Empty;

    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public int? SqFt { get; set; }

    /// <summary>Max occupants/beds in this unit. Multiple tenants can lease up to this limit.</summary>
    public int Capacity { get; set; } = 1;

    /// <summary>Per-bed rent (what each tenant pays).</summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal MonthlyRent { get; set; }

    /// <summary>Optional floor-plan label (e.g. "4-Bed Shared", "Studio").</summary>
    [MaxLength(100)]
    public string? FloorPlan { get; set; }

    public UnitStatus Status { get; set; } = UnitStatus.Available;

    [MaxLength(2000)]
    public string? Description { get; set; }

    // --- Public-facing fields ---

    public bool Furnished { get; set; }
    public bool PetsAllowed { get; set; }
    public bool ParkingIncluded { get; set; }
    public bool UtilitiesIncluded { get; set; }

    public GenderRestriction? GenderRestriction { get; set; }

    public DateTime? AvailableDate { get; set; }

    public PricingModel PricingModel { get; set; } = PricingModel.WholeUnit;
    public PricingPeriod PricingPeriod { get; set; } = PricingPeriod.Monthly;

    [Column(TypeName = "decimal(10,2)")]
    public decimal? BedPrice { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal? Deposit { get; set; }

    [MaxLength(500)]
    public string? FeaturedImageUrl { get; set; }

    /// <summary>Comma-separated tags: "in-unit washer,dishwasher,A/C"</summary>
    [MaxLength(2000)]
    public string? Features { get; set; }

    /// <summary>Comma-separated: "fall,winter,spring"</summary>
    [MaxLength(200)]
    public string? SemesterAvailability { get; set; }

    /// <summary>Comma-separated: "semester,6-month,12-month"</summary>
    [MaxLength(200)]
    public string? LeaseTerms { get; set; }

    public bool IsPublished { get; set; }

    // --- Timestamps ---

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // --- Navigation ---

    public ICollection<Lease> Leases { get; set; } = new List<Lease>();
    public ICollection<MaintenanceRequest> MaintenanceRequests { get; set; } = new List<MaintenanceRequest>();
    public ICollection<UnitImage> Images { get; set; } = new List<UnitImage>();
}
