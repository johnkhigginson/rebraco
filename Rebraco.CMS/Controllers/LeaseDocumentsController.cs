using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/leases/{leaseId:int}/documents")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class LeaseDocumentsController : ControllerBase
{
    private readonly RebracoDbContext _db;
    private readonly MediaUploadService _media;
    private readonly IMemberManager _memberManager;
    private readonly ILogger<LeaseDocumentsController> _logger;

    public LeaseDocumentsController(
        RebracoDbContext db,
        MediaUploadService media,
        IMemberManager memberManager,
        ILogger<LeaseDocumentsController> logger)
    {
        _db = db;
        _media = media;
        _memberManager = memberManager;
        _logger = logger;
    }

    /// <summary>List all documents for a lease, ordered by SortOrder.</summary>
    [HttpGet]
    public async Task<IActionResult> List(int leaseId)
    {
        var exists = await _db.Leases.AnyAsync(l => l.Id == leaseId);
        if (!exists) return NotFound(new { error = "Lease not found." });

        var documents = await _db.LeaseDocuments
            .Where(d => d.LeaseId == leaseId)
            .OrderBy(d => d.SortOrder)
            .Select(d => new
            {
                d.Id,
                d.Url,
                d.FileName,
                d.FileSize,
                DocumentType = d.DocumentType.ToString(),
                d.Description,
                d.SortOrder,
                d.CreatedAt,
            })
            .ToListAsync();

        return Ok(new { documents });
    }

    /// <summary>Upload a document and attach it to a lease.</summary>
    [HttpPost]
    public async Task<IActionResult> Upload(
        int leaseId,
        [FromForm] IFormFile file,
        [FromForm] string? documentType,
        [FromForm] string? description)
    {
        var lease = await _db.Leases.FindAsync(leaseId);
        if (lease == null) return NotFound(new { error = "Lease not found." });

        var (url, error) = _media.UploadDocument(file, "Lease Documents");
        if (url == null) return BadRequest(new { error });

        var member = await _memberManager.GetCurrentMemberAsync();
        var memberKey = member?.Key ?? Guid.Empty;

        var maxSort = await _db.LeaseDocuments
            .Where(d => d.LeaseId == leaseId)
            .MaxAsync(d => (int?)d.SortOrder) ?? -1;

        var docTypeEnum = Enum.TryParse<LeaseDocumentType>(documentType, true, out var dt)
            ? dt
            : LeaseDocumentType.Other;

        var doc = new LeaseDocument
        {
            LeaseId = leaseId,
            Url = url,
            FileName = file.FileName,
            FileSize = file.Length,
            DocumentType = docTypeEnum,
            Description = description,
            UploadedByMemberKey = memberKey,
            SortOrder = maxSort + 1,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _db.LeaseDocuments.Add(doc);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Document #{DocId} ({Type}) uploaded for Lease #{LeaseId}",
            doc.Id, doc.DocumentType, leaseId);

        return Ok(new
        {
            success = true,
            document = new
            {
                doc.Id,
                doc.Url,
                doc.FileName,
                doc.FileSize,
                DocumentType = doc.DocumentType.ToString(),
                doc.Description,
                doc.SortOrder,
                doc.CreatedAt,
            },
        });
    }

    /// <summary>Update metadata for a lease document.</summary>
    [HttpPatch("{docId:int}")]
    public async Task<IActionResult> Update(int leaseId, int docId, [FromBody] UpdateLeaseDocumentRequest request)
    {
        var doc = await _db.LeaseDocuments
            .FirstOrDefaultAsync(d => d.Id == docId && d.LeaseId == leaseId);
        if (doc == null) return NotFound(new { error = "Document not found." });

        if (request.Description != null) doc.Description = request.Description;
        if (request.SortOrder.HasValue) doc.SortOrder = request.SortOrder.Value;
        if (request.DocumentType != null &&
            Enum.TryParse<LeaseDocumentType>(request.DocumentType, true, out var dt))
        {
            doc.DocumentType = dt;
        }

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    /// <summary>Delete a document and its media file.</summary>
    [HttpDelete("{docId:int}")]
    public async Task<IActionResult> Delete(int leaseId, int docId)
    {
        var doc = await _db.LeaseDocuments
            .FirstOrDefaultAsync(d => d.Id == docId && d.LeaseId == leaseId);
        if (doc == null) return NotFound(new { error = "Document not found." });

        _db.LeaseDocuments.Remove(doc);
        await _db.SaveChangesAsync();

        // Best-effort delete from Umbraco media library
        _media.Delete(doc.Url);

        _logger.LogInformation("Rebraco: Document #{DocId} deleted from Lease #{LeaseId}",
            docId, leaseId);

        return Ok(new { success = true });
    }

    /// <summary>Bulk reorder documents by providing an ordered array of document IDs.</summary>
    [HttpPatch("reorder")]
    public async Task<IActionResult> Reorder(int leaseId, [FromBody] ReorderLeaseDocumentsRequest request)
    {
        if (request.DocumentIds == null || request.DocumentIds.Length == 0)
            return BadRequest(new { error = "documentIds array is required." });

        var docs = await _db.LeaseDocuments
            .Where(d => d.LeaseId == leaseId)
            .ToListAsync();

        var lookup = docs.ToDictionary(d => d.Id);

        for (int i = 0; i < request.DocumentIds.Length; i++)
        {
            if (lookup.TryGetValue(request.DocumentIds[i], out var doc))
                doc.SortOrder = i;
        }

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }
}

// ─── Request DTOs ────────────────────────────────────────────

public class UpdateLeaseDocumentRequest
{
    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(30)]
    public string? DocumentType { get; set; }

    public int? SortOrder { get; set; }
}

public class ReorderLeaseDocumentsRequest
{
    public int[] DocumentIds { get; set; } = Array.Empty<int>();
}
