using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

public class MaintenanceNoteImage
{
    public int Id { get; set; }

    public int MaintenanceNoteId { get; set; }
    public MaintenanceNote MaintenanceNote { get; set; } = null!;

    [Required, MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Alt { get; set; }

    public int SortOrder { get; set; }
}
