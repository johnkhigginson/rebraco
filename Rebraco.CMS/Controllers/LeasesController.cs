using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/leases")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class LeasesController : ControllerBase
{
    private readonly LeaseService _service;
    private readonly ILogger<LeasesController> _logger;

    public LeasesController(LeaseService service, ILogger<LeasesController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] LeaseStatus? status,
        [FromQuery] int? unitId,
        [FromQuery] int? tenantId,
        [FromQuery] string? search,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 25)
    {
        if (take > 100) take = 100;

        var (items, total) = await _service.GetAllAsync(new LeaseFilterDto
        {
            Status = status,
            UnitId = unitId,
            TenantId = tenantId,
            Search = search,
            Skip = skip,
            Take = take,
        });

        return Ok(new
        {
            items = items.Select(l => new
            {
                l.Id,
                l.UnitId,
                unitNumber = l.Unit.UnitNumber,
                propertyName = l.Unit.Property.Name,
                l.TenantId,
                tenantName = $"{l.Tenant.FirstName} {l.Tenant.LastName}",
                l.BedDesignation,
                l.StartDate,
                l.EndDate,
                l.MonthlyRent,
                status = l.Status.ToString(),
                leaseType = l.LeaseType.ToString(),
                l.CreatedAt,
            }),
            total,
            skip,
            take,
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var lease = await _service.GetByIdAsync(id);
        if (lease == null)
            return NotFound(new { error = "Lease not found." });

        return Ok(new
        {
            lease.Id,
            lease.UnitId,
            lease.TenantId,
            lease.BedDesignation,
            lease.StartDate,
            lease.EndDate,
            lease.MonthlyRent,
            lease.SecurityDeposit,
            status = lease.Status.ToString(),
            leaseType = lease.LeaseType.ToString(),
            lease.CreatedAt,
            lease.UpdatedAt,
            unit = new
            {
                lease.Unit.Id,
                lease.Unit.UnitNumber,
                lease.Unit.FloorPlan,
                property = new { lease.Unit.Property.Id, lease.Unit.Property.Name },
            },
            tenant = new
            {
                lease.Tenant.Id,
                name = $"{lease.Tenant.FirstName} {lease.Tenant.LastName}",
                lease.Tenant.Email,
            },
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLeaseRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (lease, error) = await _service.CreateAsync(new CreateLeaseDto
        {
            UnitId = request.UnitId,
            TenantId = request.TenantId,
            BedDesignation = request.BedDesignation,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            MonthlyRent = request.MonthlyRent,
            SecurityDeposit = request.SecurityDeposit,
            Status = request.Status,
            LeaseType = request.LeaseType,
        });

        if (lease == null)
            return Conflict(new { error });

        return Ok(new { success = true, id = lease.Id });
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLeaseRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var lease = await _service.UpdateAsync(id, new UpdateLeaseDto
        {
            BedDesignation = request.BedDesignation,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            MonthlyRent = request.MonthlyRent,
            SecurityDeposit = request.SecurityDeposit,
            LeaseType = request.LeaseType,
        });

        if (lease == null)
            return NotFound(new { error = "Lease not found." });

        // If status was provided, update via UpdateStatusAsync (has capacity validation)
        if (request.Status.HasValue)
        {
            var (updated, error) = await _service.UpdateStatusAsync(id, request.Status.Value);
            if (updated == null)
                return Conflict(new { error });
        }

        return Ok(new { success = true });
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateLeaseStatusRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (lease, error) = await _service.UpdateStatusAsync(id, request.Status);
        if (lease == null)
            return Conflict(new { error });

        return Ok(new { success = true, status = lease.Status.ToString() });
    }
}

// --- Request DTOs ---

public class CreateLeaseRequest : IValidatableObject
{
    [Required]
    public int UnitId { get; set; }

    [Required]
    public int TenantId { get; set; }

    [MaxLength(50)]
    public string? BedDesignation { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Range(0, 1_000_000)]
    public decimal MonthlyRent { get; set; }

    [Range(0, 1_000_000)]
    public decimal? SecurityDeposit { get; set; }

    public LeaseStatus Status { get; set; } = LeaseStatus.Pending;
    public LeaseType LeaseType { get; set; } = LeaseType.Fixed;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (EndDate <= StartDate)
            yield return new ValidationResult("End date must be after start date.", [nameof(EndDate)]);
    }
}

public class UpdateLeaseRequest
{
    [MaxLength(50)]
    public string? BedDesignation { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal? MonthlyRent { get; set; }
    public decimal? SecurityDeposit { get; set; }
    public LeaseType? LeaseType { get; set; }
    public LeaseStatus? Status { get; set; }
}

public class UpdateLeaseStatusRequest
{
    [Required]
    public LeaseStatus Status { get; set; }
}
