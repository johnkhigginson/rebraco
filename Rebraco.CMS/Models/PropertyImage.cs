using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

public class PropertyImage
{
    public int Id { get; set; }

    public int PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    [Required, MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Alt { get; set; }

    public int SortOrder { get; set; }
}
