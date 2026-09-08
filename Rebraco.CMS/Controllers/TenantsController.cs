using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/tenants")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class TenantsController : ControllerBase
{
    private readonly TenantService _service;
    private readonly ILogger<TenantsController> _logger;

    public TenantsController(TenantService service, ILogger<TenantsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] TenantStatus? status,
        [FromQuery] string? search,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 25)
    {
        if (take > 100) take = 100;

        var (items, total) = await _service.GetAllAsync(new TenantFilterDto
        {
            Status = status,
            Search = search,
            Skip = skip,
            Take = take,
        });

        return Ok(new
        {
            items = items.Select(t => new
            {
                t.Id,
                t.FirstName,
                t.LastName,
                t.Email,
                t.Phone,
                status = t.Status.ToString(),
                t.MoveInDate,
                t.CreatedAt,
            }),
            total,
            skip,
            take,
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var tenant = await _service.GetByIdAsync(id);
        if (tenant == null)
            return NotFound(new { error = "Tenant not found." });

        return Ok(new
        {
            tenant.Id,
            tenant.FirstName,
            tenant.LastName,
            tenant.Email,
            tenant.Phone,
            tenant.EmergencyContactName,
            tenant.EmergencyContactPhone,
            tenant.MoveInDate,
            status = tenant.Status.ToString(),
            tenant.CreatedAt,
            tenant.UpdatedAt,
            leases = tenant.Leases.Select(l => new
            {
                l.Id,
                l.UnitId,
                unitNumber = l.Unit.UnitNumber,
                propertyName = l.Unit.Property.Name,
                l.BedDesignation,
                l.StartDate,
                l.EndDate,
                l.MonthlyRent,
                status = l.Status.ToString(),
            }),
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTenantRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (tenant, error) = await _service.CreateAsync(new CreateTenantDto
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactPhone = request.EmergencyContactPhone,
            MoveInDate = request.MoveInDate,
            Status = request.Status,
        });

        if (tenant == null)
            return Conflict(new { error });

        return Ok(new { success = true, id = tenant.Id });
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTenantRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var tenant = await _service.UpdateAsync(id, new UpdateTenantDto
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactPhone = request.EmergencyContactPhone,
            MoveInDate = request.MoveInDate,
            Status = request.Status,
        });

        if (tenant == null)
            return NotFound(new { error = "Tenant not found." });

        return Ok(new { success = true });
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTenantStatusRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var tenant = await _service.UpdateStatusAsync(id, request.Status);
        if (tenant == null)
            return NotFound(new { error = "Tenant not found." });

        return Ok(new { success = true, status = tenant.Status.ToString() });
    }
}

// --- Request DTOs ---

public class CreateTenantRequest
{
    [Required, MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Phone { get; set; }

    [MaxLength(150)]
    public string? EmergencyContactName { get; set; }

    [MaxLength(30)]
    public string? EmergencyContactPhone { get; set; }

    public DateTime? MoveInDate { get; set; }

    public TenantStatus? Status { get; set; }
}

public class UpdateTenantRequest
{
    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [EmailAddress, MaxLength(254)]
    public string? Email { get; set; }

    [MaxLength(30)]
    public string? Phone { get; set; }

    [MaxLength(150)]
    public string? EmergencyContactName { get; set; }

    [MaxLength(30)]
    public string? EmergencyContactPhone { get; set; }

    public DateTime? MoveInDate { get; set; }

    public TenantStatus? Status { get; set; }
}

public class UpdateTenantStatusRequest
{
    [Required]
    public TenantStatus Status { get; set; }
}
