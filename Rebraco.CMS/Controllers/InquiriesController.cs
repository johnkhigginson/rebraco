using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/inquiries")]
public class InquiriesController : ControllerBase
{
    private readonly InquiryService _service;
    private readonly IMemberManager _memberManager;

    public InquiriesController(InquiryService service, IMemberManager memberManager)
    {
        _service = service;
        _memberManager = memberManager;
    }

    /// <summary>Submit a new inquiry (public — called from InquiryForm).</summary>
    [HttpPost]
    [EnableRateLimiting("PublicForm")]
    public async Task<IActionResult> Submit([FromBody] SubmitInquiryRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var inquiry = await _service.SubmitAsync(new SubmitInquiryDto
        {
            PropertyId = request.PropertyId,
            PropertyName = request.PropertyName,
            UnitId = request.UnitId,
            UnitName = request.UnitName,
            EfPropertyId = request.EfPropertyId,
            EfUnitId = request.EfUnitId,
            FullName = request.FullName,
            Email = request.Email,
            Phone = request.Phone,
            PreferredMoveInDate = request.MoveInDate,
            PreferredLeaseTerm = request.LeaseTerm,
            Message = request.Message,
        });

        return Ok(new { success = true, id = inquiry.Id });
    }

    /// <summary>List inquiries with optional filters (management endpoint).</summary>
    [HttpGet]
    [UmbracoMemberAuthorize("", "PropertyManager", "")]
    public async Task<IActionResult> List(
        [FromQuery] InquiryStatus? status,
        [FromQuery] string? propertyId,
        [FromQuery] string? search,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 25)
    {
        if (take > 100) take = 100;

        var (items, total) = await _service.GetAllAsync(new InquiryFilterDto
        {
            Status = status,
            PropertyId = propertyId,
            Search = search,
            Skip = skip,
            Take = take,
        });

        return Ok(new
        {
            items = items.Select(i => new
            {
                i.Id,
                i.PropertyId,
                i.PropertyName,
                i.UnitId,
                i.UnitName,
                i.EfPropertyId,
                i.EfUnitId,
                i.FullName,
                i.Email,
                i.Phone,
                status = i.Status.ToString(),
                i.Source,
                i.CreatedAt,
                i.UpdatedAt,
            }),
            total,
            skip,
            take,
        });
    }

    /// <summary>Get a single inquiry with notes (management endpoint).</summary>
    [HttpGet("{id:int}")]
    [UmbracoMemberAuthorize("", "PropertyManager", "")]
    public async Task<IActionResult> GetById(int id)
    {
        var inquiry = await _service.GetByIdAsync(id);
        if (inquiry == null)
            return NotFound(new { error = "Inquiry not found." });

        return Ok(new
        {
            inquiry.Id,
            inquiry.PropertyId,
            inquiry.PropertyName,
            inquiry.UnitId,
            inquiry.UnitName,
            inquiry.EfPropertyId,
            inquiry.EfUnitId,
            inquiry.FullName,
            inquiry.Email,
            inquiry.Phone,
            inquiry.PreferredMoveInDate,
            inquiry.PreferredLeaseTerm,
            inquiry.Message,
            status = inquiry.Status.ToString(),
            inquiry.Source,
            inquiry.CreatedAt,
            inquiry.UpdatedAt,
            notes = inquiry.Notes.Select(n => new
            {
                n.Id,
                n.Author,
                n.Content,
                n.CreatedAt,
            }),
        });
    }

    /// <summary>Update inquiry status (management endpoint).</summary>
    [HttpPatch("{id:int}/status")]
    [UmbracoMemberAuthorize("", "PropertyManager", "")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var inquiry = await _service.UpdateStatusAsync(id, request.Status);
        if (inquiry == null)
            return NotFound(new { error = "Inquiry not found." });

        return Ok(new { success = true, status = inquiry.Status.ToString() });
    }

    /// <summary>Add a follow-up note to an inquiry (management endpoint).</summary>
    [HttpPost("{id:int}/notes")]
    [UmbracoMemberAuthorize("", "PropertyManager", "")]
    public async Task<IActionResult> AddNote(int id, [FromBody] AddNoteRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var member = await _memberManager.GetCurrentMemberAsync();
        var author = member?.Name ?? "Unknown";

        var note = await _service.AddNoteAsync(id, author, request.Content);
        if (note == null)
            return NotFound(new { error = "Inquiry not found." });

        return Ok(new { success = true, noteId = note.Id });
    }

    /// <summary>Convert inquiry to tenant + lease (management endpoint).</summary>
    [HttpPost("{id:int}/convert")]
    [UmbracoMemberAuthorize("", "PropertyManager", "")]
    public async Task<IActionResult> Convert(int id, [FromBody] ConvertInquiryRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (tenant, lease, error) = await _service.ConvertToTenantAsync(id, new ConvertInquiryDto
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            MoveInDate = request.MoveInDate,
            UnitId = request.UnitId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            MonthlyRent = request.MonthlyRent,
            SecurityDeposit = request.SecurityDeposit,
            BedDesignation = request.BedDesignation,
            LeaseType = request.LeaseType ?? "Fixed",
        });

        if (error != null)
        {
            if (error.Contains("not found"))
                return NotFound(new { error });
            if (error.Contains("already closed"))
                return BadRequest(new { error });
            return Conflict(new { error });
        }

        return Ok(new { tenantId = tenant!.Id, leaseId = lease!.Id });
    }
}

// --- Request DTOs ---

public class SubmitInquiryRequest
{
    public string? PropertyId { get; set; }
    public string? PropertyName { get; set; }
    public string? UnitId { get; set; }
    public string? UnitName { get; set; }

    /// <summary>EF Core Property ID (from /properties routes).</summary>
    public int? EfPropertyId { get; set; }

    /// <summary>EF Core Unit ID (from /properties routes).</summary>
    public int? EfUnitId { get; set; }

    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Phone { get; set; }

    public DateTime? MoveInDate { get; set; }

    [MaxLength(50)]
    public string? LeaseTerm { get; set; }

    [MaxLength(2000)]
    public string? Message { get; set; }
}

public class UpdateStatusRequest
{
    [Required]
    public InquiryStatus Status { get; set; }
}

public class AddNoteRequest
{
    [Required, MaxLength(4000)]
    public string Content { get; set; } = string.Empty;
}

public class ConvertInquiryRequest : IValidatableObject
{
    [Required, MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Phone { get; set; }

    public DateTime? MoveInDate { get; set; }

    [Required]
    public int UnitId { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required, Range(0, 1_000_000)]
    public decimal MonthlyRent { get; set; }

    [Range(0, 1_000_000)]
    public decimal? SecurityDeposit { get; set; }

    [MaxLength(50)]
    public string? BedDesignation { get; set; }

    [MaxLength(20)]
    public string? LeaseType { get; set; } = "Fixed";

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (EndDate <= StartDate)
            yield return new ValidationResult("End date must be after start date.", [nameof(EndDate)]);
    }
}
