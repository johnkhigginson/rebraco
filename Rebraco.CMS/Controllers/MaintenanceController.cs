using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/maintenance")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class MaintenanceController : ControllerBase
{
    private readonly MaintenanceService _service;
    private readonly MediaUploadService _media;
    private readonly IMemberManager _memberManager;
    private readonly ILogger<MaintenanceController> _logger;

    public MaintenanceController(
        MaintenanceService service,
        MediaUploadService media,
        IMemberManager memberManager,
        ILogger<MaintenanceController> logger)
    {
        _service = service;
        _media = media;
        _memberManager = memberManager;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] MaintenanceStatus? status,
        [FromQuery] MaintenancePriority? priority,
        [FromQuery] MaintenanceCategory? category,
        [FromQuery] int? unitId,
        [FromQuery] string? search,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 25)
    {
        if (take > 100) take = 100;

        var (items, total) = await _service.GetAllAsync(new MaintenanceFilterDto
        {
            Status = status,
            Priority = priority,
            Category = category,
            UnitId = unitId,
            Search = search,
            Skip = skip,
            Take = take,
        });

        return Ok(new
        {
            items = items.Select(m => new
            {
                m.Id,
                m.Title,
                m.LocationDetail,
                m.UnitId,
                unitNumber = m.Unit.UnitNumber,
                propertyName = m.Unit.Property.Name,
                m.TenantId,
                tenantName = m.Tenant != null ? $"{m.Tenant.FirstName} {m.Tenant.LastName}" : null,
                priority = m.Priority.ToString(),
                status = m.Status.ToString(),
                category = m.Category.ToString(),
                m.CreatedAt,
            }),
            total,
            skip,
            take,
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var request = await _service.GetByIdAsync(id);
        if (request == null)
            return NotFound(new { error = "Maintenance request not found." });

        return Ok(new
        {
            request.Id,
            request.Title,
            request.Description,
            request.LocationDetail,
            request.PermissionToEnter,
            request.PreferredAvailability,
            request.UrgencyNotes,
            priority = request.Priority.ToString(),
            status = request.Status.ToString(),
            category = request.Category.ToString(),
            request.ScheduledDate,
            request.CompletedDate,
            request.EstimatedCost,
            request.ActualCost,
            request.CreatedAt,
            request.UpdatedAt,
            unit = new
            {
                request.Unit.Id,
                request.Unit.UnitNumber,
                property = new { request.Unit.Property.Id, request.Unit.Property.Name },
            },
            tenant = request.Tenant != null ? new
            {
                request.Tenant.Id,
                name = $"{request.Tenant.FirstName} {request.Tenant.LastName}",
                request.Tenant.Email,
            } : null,
            images = request.Images.Select(i => new { i.Id, i.Url, i.Alt, i.SortOrder }),
            notes = request.Notes.Select(n => new
            {
                n.Id,
                n.Author,
                n.Content,
                n.CreatedAt,
                images = n.Images.Select(i => new { i.Id, i.Url, i.Alt, i.SortOrder }),
            }),
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMaintenanceRequestBody body)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var request = await _service.CreateAsync(new CreateMaintenanceDto
        {
            UnitId = body.UnitId,
            TenantId = body.TenantId,
            Title = body.Title,
            Description = body.Description,
            LocationDetail = body.LocationDetail,
            PermissionToEnter = body.PermissionToEnter,
            PreferredAvailability = body.PreferredAvailability,
            UrgencyNotes = body.UrgencyNotes,
            Priority = body.Priority,
            Category = body.Category,
            ScheduledDate = body.ScheduledDate,
            EstimatedCost = body.EstimatedCost,
        });

        if (request == null)
            return NotFound(new { error = "Unit not found." });

        return Ok(new { success = true, id = request.Id });
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMaintenanceRequestBody body)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var request = await _service.UpdateAsync(id, new UpdateMaintenanceDto
        {
            Title = body.Title,
            Description = body.Description,
            LocationDetail = body.LocationDetail,
            PermissionToEnter = body.PermissionToEnter,
            PreferredAvailability = body.PreferredAvailability,
            UrgencyNotes = body.UrgencyNotes,
            Priority = body.Priority,
            Category = body.Category,
            ScheduledDate = body.ScheduledDate,
            EstimatedCost = body.EstimatedCost,
            ActualCost = body.ActualCost,
        });

        if (request == null)
            return NotFound(new { error = "Maintenance request not found." });

        return Ok(new { success = true });
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateMaintenanceStatusRequest body)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var request = await _service.UpdateStatusAsync(id, body.Status);
        if (request == null)
            return NotFound(new { error = "Maintenance request not found." });

        return Ok(new { success = true, status = request.Status.ToString() });
    }

    [HttpPost("{id:int}/notes")]
    public async Task<IActionResult> AddNote(int id, [FromBody] AddMaintenanceNoteRequest body)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var member = await _memberManager.GetCurrentMemberAsync();
        var author = member?.Name ?? "Unknown";

        var note = await _service.AddNoteAsync(id, author, body.Content);
        if (note == null)
            return NotFound(new { error = "Maintenance request not found." });

        return Ok(new { success = true, noteId = note.Id });
    }

    // ═══════════════════════════════════════════════════════════════════
    // Image Endpoints
    // ═══════════════════════════════════════════════════════════════════

    /// <summary>Upload an image to a maintenance request.</summary>
    [HttpPost("{id:int}/images")]
    public async Task<IActionResult> UploadImage(int id, [FromForm] IFormFile file, [FromForm] string? alt)
    {
        var (url, error) = _media.Upload(file, "Maintenance");
        if (url == null) return BadRequest(new { error });

        var image = await _service.AddRequestImageAsync(id, url, alt);
        if (image == null) return NotFound(new { error = "Maintenance request not found." });

        return Ok(new { image.Id, image.Url, image.Alt, image.SortOrder });
    }

    /// <summary>Delete an image from a maintenance request.</summary>
    [HttpDelete("{id:int}/images/{imageId:int}")]
    public async Task<IActionResult> DeleteImage(int id, int imageId)
    {
        var url = await _service.DeleteRequestImageAsync(id, imageId);
        if (url == null) return NotFound(new { error = "Image not found." });

        _media.Delete(url);
        return NoContent();
    }

    /// <summary>Upload an image to a maintenance note.</summary>
    [HttpPost("{id:int}/notes/{noteId:int}/images")]
    public async Task<IActionResult> UploadNoteImage(int id, int noteId, [FromForm] IFormFile file, [FromForm] string? alt)
    {
        var (url, error) = _media.Upload(file, "Maintenance");
        if (url == null) return BadRequest(new { error });

        var image = await _service.AddNoteImageAsync(noteId, url, alt);
        if (image == null) return NotFound(new { error = "Note not found." });

        return Ok(new { image.Id, image.Url, image.Alt, image.SortOrder });
    }

    /// <summary>Delete an image from a maintenance note.</summary>
    [HttpDelete("{id:int}/notes/{noteId:int}/images/{imageId:int}")]
    public async Task<IActionResult> DeleteNoteImage(int id, int noteId, int imageId)
    {
        var url = await _service.DeleteNoteImageAsync(noteId, imageId);
        if (url == null) return NotFound(new { error = "Image not found." });

        _media.Delete(url);
        return NoContent();
    }
}

// --- Request DTOs ---

public class CreateMaintenanceRequestBody
{
    [Required]
    public int UnitId { get; set; }

    public int? TenantId { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? Description { get; set; }

    [MaxLength(200)]
    public string? LocationDetail { get; set; }

    public bool PermissionToEnter { get; set; }

    [MaxLength(500)]
    public string? PreferredAvailability { get; set; }

    [MaxLength(500)]
    public string? UrgencyNotes { get; set; }

    public MaintenancePriority Priority { get; set; } = MaintenancePriority.Medium;
    public MaintenanceCategory Category { get; set; } = MaintenanceCategory.Other;
    public DateTime? ScheduledDate { get; set; }

    [Range(0, 10_000_000)]
    public decimal? EstimatedCost { get; set; }
}

public class UpdateMaintenanceRequestBody
{
    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(4000)]
    public string? Description { get; set; }

    [MaxLength(200)]
    public string? LocationDetail { get; set; }

    public bool? PermissionToEnter { get; set; }

    [MaxLength(500)]
    public string? PreferredAvailability { get; set; }

    [MaxLength(500)]
    public string? UrgencyNotes { get; set; }

    public MaintenancePriority? Priority { get; set; }
    public MaintenanceCategory? Category { get; set; }
    public DateTime? ScheduledDate { get; set; }

    [Range(0, 10_000_000)]
    public decimal? EstimatedCost { get; set; }

    [Range(0, 10_000_000)]
    public decimal? ActualCost { get; set; }
}

public class UpdateMaintenanceStatusRequest
{
    [Required]
    public MaintenanceStatus Status { get; set; }
}

public class AddMaintenanceNoteRequest
{
    [Required, MaxLength(4000)]
    public string Content { get; set; } = string.Empty;
}
