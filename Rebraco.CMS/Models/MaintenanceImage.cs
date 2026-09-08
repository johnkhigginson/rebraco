using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

public class MaintenanceImage
{
    public int Id { get; set; }

    public int MaintenanceRequestId { get; set; }
    public MaintenanceRequest MaintenanceRequest { get; set; } = null!;

    [Required, MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Alt { get; set; }

    public int SortOrder { get; set; }
}
