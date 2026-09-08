using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

public class Inquiry
{
    public int Id { get; set; }

    /// <summary>Umbraco content ID of the property (building).</summary>
    [MaxLength(50)]
    public string? PropertyId { get; set; }

    [MaxLength(200)]
    public string? PropertyName { get; set; }

    /// <summary>Umbraco content ID of the unit (if inquiry is unit-specific).</summary>
    [MaxLength(50)]
    public string? UnitId { get; set; }

    [MaxLength(200)]
    public string? UnitName { get; set; }

    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Phone { get; set; }

    public DateTime? PreferredMoveInDate { get; set; }

    [MaxLength(50)]
    public string? PreferredLeaseTerm { get; set; }

    [MaxLength(2000)]
    public string? Message { get; set; }

    public InquiryStatus Status { get; set; } = InquiryStatus.New;

    /// <summary>EF Core Property ID (when inquiry originates from /properties routes).</summary>
    public int? EfPropertyId { get; set; }

    /// <summary>EF Core Unit ID (when inquiry is unit-specific from /properties routes).</summary>
    public int? EfUnitId { get; set; }

    /// <summary>How the inquiry originated: "website", "phone", "walk-in", etc.</summary>
    [MaxLength(50)]
    public string Source { get; set; } = "website";

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<InquiryNote> Notes { get; set; } = new List<InquiryNote>();

    public ICollection<Tour> Tours { get; set; } = new List<Tour>();
}
