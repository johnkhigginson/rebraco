using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

/// <summary>
/// Simple key-value store for runtime application settings
/// managed through the management portal.
/// </summary>
public class AppSetting
{
    [Key, MaxLength(100)]
    public string Key { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Value { get; set; } = string.Empty;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
