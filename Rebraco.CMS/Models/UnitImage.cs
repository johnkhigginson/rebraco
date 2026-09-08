using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

public class UnitImage
{
    public int Id { get; set; }

    public int UnitId { get; set; }
    public Unit Unit { get; set; } = null!;

    [Required, MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Alt { get; set; }

    public int SortOrder { get; set; }

    public bool IsFloorPlan { get; set; }
}
