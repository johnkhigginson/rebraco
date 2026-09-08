using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

public class MaintenanceNote
{
    public int Id { get; set; }

    public int MaintenanceRequestId { get; set; }
    public MaintenanceRequest MaintenanceRequest { get; set; } = null!;

    [Required, MaxLength(150)]
    public string Author { get; set; } = string.Empty;

    [Required, MaxLength(4000)]
    public string Content { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation
    public ICollection<MaintenanceNoteImage> Images { get; set; } = new List<MaintenanceNoteImage>();
}
