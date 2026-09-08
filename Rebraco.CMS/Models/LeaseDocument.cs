using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

public enum LeaseDocumentType
{
    LeaseAgreement,
    Amendment,
    Addendum,
    MoveInChecklist,
    Notice,
    Other
}

public class LeaseDocument
{
    public int Id { get; set; }

    public int LeaseId { get; set; }
    public Lease Lease { get; set; } = null!;

    [Required, MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    [Required, MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    /// <summary>File size in bytes.</summary>
    public long FileSize { get; set; }

    public LeaseDocumentType DocumentType { get; set; } = LeaseDocumentType.Other;

    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>Umbraco member key of the user who uploaded this document.</summary>
    public Guid UploadedByMemberKey { get; set; }

    public int SortOrder { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
