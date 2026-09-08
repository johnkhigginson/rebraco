using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Rebraco.CMS.Models;

public class Property
{
    public int Id { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(250)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Street { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(2)]
    public string? State { get; set; }

    [MaxLength(10)]
    public string? Zip { get; set; }

    public PropertyType Type { get; set; } = PropertyType.Apartment;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public int TotalUnits { get; set; }

    // --- Public-facing fields ---

    [MaxLength(500)]
    public string? FeaturedImageUrl { get; set; }

    [MaxLength(500)]
    public string? CampusProximity { get; set; }

    public bool ByuApproved { get; set; }

    public GenderRestriction? GenderRestriction { get; set; }

    [MaxLength(254)]
    public string? ContactEmail { get; set; }

    [MaxLength(30)]
    public string? ContactPhone { get; set; }

    public bool IsPublished { get; set; }

    public PricingPeriod PricingPeriod { get; set; } = PricingPeriod.Monthly;

    /// <summary>Optional manual override; public API also computes from units.</summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal? StartingRent { get; set; }

    /// <summary>Comma-separated tags: "pool,gym,laundry,clubhouse"</summary>
    [MaxLength(2000)]
    public string? BuildingAmenities { get; set; }

    // --- SEO ---

    [MaxLength(160)]
    public string? MetaTitle { get; set; }

    [MaxLength(300)]
    public string? MetaDescription { get; set; }

    // --- Timestamps ---

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    // --- Navigation ---

    public ICollection<Unit> Units { get; set; } = new List<Unit>();
    public ICollection<PropertyImage> Images { get; set; } = new List<PropertyImage>();
}
