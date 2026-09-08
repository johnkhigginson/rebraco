using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

public class InquiryNote
{
    public int Id { get; set; }

    public int InquiryId { get; set; }

    public Inquiry Inquiry { get; set; } = null!;

    /// <summary>Who wrote the note (backoffice user name).</summary>
    [Required, MaxLength(150)]
    public string Author { get; set; } = string.Empty;

    [Required, MaxLength(4000)]
    public string Content { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
